document.getElementById('auth-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const address = document.getElementById('address').value;
    const handle = document.getElementById('handle').value;

    const response = await fetch('http://localhost:3000/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address, handle })
    });

    const data = await response.json();
    document.getElementById('response-message').textContent = data.message;
    document.getElementById('auth-response').classList.remove('hidden');
});

document.getElementById('metrics-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const address = document.getElementById('metrics-address').value;
    const interactions = document.getElementById('interactions').value;
    const polSpent = document.getElementById('polSpent').value;
    const usdSpent = document.getElementById('usdSpent').value;

    const response = await fetch('http://localhost:3000/metrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address, interactions, polSpent, usdSpent })
    });

    const data = await response.json();
    document.getElementById('metrics-message').textContent = data.message;
    document.getElementById('metrics-response').classList.remove('hidden');
});
