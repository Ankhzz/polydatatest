document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
document.getElementById("getMetricsBtn").addEventListener("click", getMetrics);

let userAddress = null;

// Función para conectar la wallet con MetaMask
async function connectWallet() {
    // Verificar si MetaMask está instalado
    if (typeof window.ethereum !== "undefined") {
        try {
            // Solicitar conexión a MetaMask
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            userAddress = accounts[0]; // La dirección de la wallet
            document.getElementById("userInfo").innerHTML = `Conectado con: ${userAddress}`;
        } catch (error) {
            console.error("Error al conectar con MetaMask:", error);
        }
    } else {
        // Mostrar mensaje si MetaMask no está instalado
        alert("MetaMask no está instalado. Por favor, instálalo desde https://metamask.io/");
    }
}

// Función para obtener métricas desde el backend
async function getMetrics() {
    if (!userAddress) {
        alert("Primero conecta tu wallet.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/metrics/polygon/${userAddress}`);
        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById("metrics").innerHTML = `
                Dirección: ${data.address} <br>
                POL gastados: ${data.polSpent} <br>
                USD gastados: ${data.usdSpent}
            `;
        }
    } catch (error) {
        console.error("Error al obtener métricas:", error);
    }
}
