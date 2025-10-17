import axios from 'axios';

export default async function handler(req, res) {
    switch (req.method) {
        case 'POST':
            postHelperRekeningCOA();
            break;
        default:
            return res.status(402).end(`Method ${req.method} not allowed`);
    }

    async function postHelperRekeningCOA() {
        try {
            const postData = await axios.post(process.env.API_URL + req.headers['x-endpoint'], req.body, req.headers);
            return res.status(200).send(postData.data);
        } catch (err) {
            return res.status(500).json({ status: 'error' });
        }
    }
}
