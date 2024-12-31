// Proyecto: Frame para Warpcast con métricas de Polygon PoS
// Tecnologías: Express.js, ethers.js, dotenv, axios

require('dotenv').config();
const { ethers, BigNumber } = require('ethers');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// 1. Configuración de conexión con Polygon
const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

// 2. Endpoints para la aplicación
// Ruta para la raíz del servidor
app.get('/', (req, res) => {
    res.send('Bienvenido al Frame para Warpcast con métricas de Polygon PoS');
});

// Autenticación básica
app.post('/auth', async (req, res) => {
    const { address, handle } = req.body;
    if (!address || !handle) return res.status(400).json({ error: 'Faltan datos' });

    res.json({ message: 'Usuario autenticado', address, handle });
});

// Guardar métricas (simulado en memoria)
let metricsStorage = {};

app.post('/metrics', async (req, res) => {
    const { address, interactions, polSpent, usdSpent } = req.body;

    if (!address || interactions == null || polSpent == null || usdSpent == null) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    metricsStorage[address] = { interactions, polSpent, usdSpent };
    res.json({ message: 'Métricas guardadas correctamente', data: metricsStorage[address] });
});

// Obtener métricas de Polygon
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
        let totalGas = BigNumber.from(0); // Usamos BigNumber para mantener la precisión
        let totalTransferred = BigNumber.from(0); // Variable para el total de MATIC transferido
        let totalReceived = BigNumber.from(0); // Variable para acumular el POL recibido

        transactions.forEach(tx => {
            const gasUsed = BigNumber.from(tx.gasUsed);
            const gasPrice = BigNumber.from(tx.gasPrice);
            const gasSpentInWei = gasUsed.mul(gasPrice);
            totalGas = totalGas.add(gasSpentInWei);
        
            if (tx.value) {
                const valueInWei = BigNumber.from(tx.value);
                totalTransferred = totalTransferred.add(valueInWei);
        
                // Verificar si la transacción fue enviada a nuestra dirección
                if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                    totalReceived = totalReceived.add(valueInWei); // Acumular POL recibido
                }
            }
        });

        // Convertimos de Wei a Ether
        const totalGasInEther = ethers.utils.formatUnits(totalGas, 'ether');
        const totalTransferredInEther = ethers.utils.formatUnits(totalTransferred, 'ether');
        const totalReceivedInEther = ethers.utils.formatUnits(totalReceived, 'ether');

        // Obtenemos el precio en USD
        const usdReceived = parseFloat(totalReceivedInEther) * (await getPolToUsd());        
        const usdSpent = parseFloat(totalGasInEther) * (await getPolToUsd());
        const usdTransferred = parseFloat(totalTransferredInEther) * (await getPolToUsd());

       
        res.json({ 
            address, 
            totalGasSpent: totalGasInEther, 
            totalTransferred: totalTransferredInEther, 
            totalTransactions: transactions.length, 
            totalReceived: totalReceivedInEther,  // Agregar total recibido          
            usdSpent,
            usdTransferred
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos de Polygon' });
    }
});

// Utilidad para obtener el precio de POL en USD
async function getPolToUsd() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: { ids: 'matic-network', vs_currencies: 'usd' },
        });
        return response.data['matic-network'].usd;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

// 3. Inicio del servidor
app.listen(PORT, () => console.log(`Servidor ejecutándose en http://localhost:${PORT}`));
