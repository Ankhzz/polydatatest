require('dotenv').config();
const { ethers, BigNumber } = require('ethers');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const moment = require('moment');  // Para manejar fechas

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

app.get('/', (req, res) => {
    res.send('Bienvenido al servidor para métricas de Polygon PoS');
});

app.get('/metrics/polygon/:address', async (req, res) => {
    const { address } = req.params;

    try {
        const response = await axios.get(`https://api.polygonscan.com/api`, {
            params: {
                module: 'account',
                action: 'txlist',
                address,
                startblock: 0,
                endblock: 99999999,
                sort: 'asc',
                apikey: process.env.POLYGONSCAN_API_KEY,
            },
        });

        const transactions = response.data.result;
        let totalGas = BigNumber.from(0);
        let totalSpent = BigNumber.from(0);
        let totalReceived = BigNumber.from(0);
        let lastTxDate = null;

        transactions.forEach(tx => {
            // Excluir transacciones fallidas
            if (tx.isError === "1") {
                console.log(`Transacción fallida excluida: ${tx.hash}`);
                return;
            }

            const gasUsed = BigNumber.from(tx.gasUsed);
            const gasPrice = BigNumber.from(tx.gasPrice);
            const gasCost = gasUsed.mul(gasPrice);
            totalGas = totalGas.add(gasCost);

            const valueInWei = BigNumber.from(tx.value);

            if (tx.from.toLowerCase() === address.toLowerCase()) {
                totalSpent = totalSpent.add(valueInWei.add(gasCost)); // Incluir gas en el gasto total
            }

            if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                totalReceived = totalReceived.add(valueInWei);
            }

            // Guardar la fecha de la última transacción
            if (!lastTxDate || moment(tx.timeStamp * 1000).isAfter(lastTxDate)) {
                lastTxDate = moment(tx.timeStamp * 1000); // Convertir timestamp a fecha
            }
        });

        const balanceWei = await provider.getBalance(address);
        const balanceEther = ethers.utils.formatUnits(balanceWei, 'ether');
        
        // Cálculo de POL Spent
        const totalGasInEther = ethers.utils.formatUnits(totalGas, 'ether');
        const totalSpentInEther = ethers.utils.formatUnits(totalSpent, 'ether');
        const totalReceivedInEther = ethers.utils.formatUnits(totalReceived, 'ether');
        const polSpent = parseFloat(totalSpentInEther) - parseFloat(totalReceivedInEther) - parseFloat(balanceEther);

        // Cálculo del gas promedio
        const averageGasUsed = totalGas.div(transactions.length).toString();

        // Rango de actividad (transacciones en la última semana)
        const oneWeekAgo = moment().subtract(7, 'days');
        const recentTxs = transactions.filter(tx => moment(tx.timeStamp * 1000).isAfter(oneWeekAgo));
        const activityRange = recentTxs.length;

        // Respuesta final
        res.json({
            address,
            totalTransactions: transactions.length,
            polSpent: polSpent.toFixed(2),
            polReceived: parseFloat(totalReceivedInEther).toFixed(2),
            gasSpent: parseFloat(totalGasInEther).toFixed(8),
            lastActivity: lastTxDate ? lastTxDate.format('YYYY-MM-DD HH:mm:ss') : 'N/A',
            averageGasUsed: ethers.utils.formatUnits(averageGasUsed, 'ether'),
            activityRange,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos de Polygon' });
    }
});

app.listen(PORT, () => console.log(`Servidor ejecutándose en http://localhost:${PORT}`));
