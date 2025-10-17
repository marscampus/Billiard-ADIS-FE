const URLBE = process.env.API_URL;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'email not found' });
    }

    try {
        const data = await getPluginResto(email);

        res.setHeader('Content-Type', 'application/json');
        res.send({ data });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ message: 'Internal Server Error Failed To Get QRCode' });
    }
}

async function getPluginResto(email) {
    const res = await fetch(URLBE + '/api/plugin/checkpluginuser/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }) // Mengirim payload dalam format JSON
    });

    const result = await res.json();
    return result;
}
