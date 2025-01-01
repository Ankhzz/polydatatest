document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
document.getElementById("getMetricsBtn").addEventListener("click", getMetrics);

let userAddress = null;

async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            userAddress = accounts[0];
            const connectBtn = document.getElementById("connectWalletBtn");
            connectBtn.textContent = "CONECTED";
            connectBtn.style.backgroundColor = "purple";
            connectBtn.disabled = true;
            document.getElementById("getMetricsBtn").disabled = false;
        } catch (error) {
            console.error("Error when trying to connect with MetaMask:", error);
        }
    } else {
        alert("You don't have MetaMask. Please, install a web extension from: https://metamask.io/");
    }
}

async function getMetrics() {
    if (!userAddress) {
        alert("Connect your wallet first.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/metrics/polygon/${userAddress}`);
        const data = await response.json();

        console.log(data);

        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById("metricsAddress").textContent = data.address;
            document.getElementById("totalTransactions").textContent = data.totalTransactions;
            document.getElementById("polSpent").textContent = data.polSpent;
            document.getElementById("polReceived").textContent = data.polReceived;
            document.getElementById("gasSpent").textContent = data.gasSpent;
            document.getElementById("lastActivity").textContent = data.lastActivity;
            document.getElementById("averageGasUsed").textContent = data.averageGasUsed;
            document.getElementById("activityRange").textContent = data.activityRange;
        }
        
    } catch (error) {
        console.error("Error", error);
        alert("Error");
    }
}
