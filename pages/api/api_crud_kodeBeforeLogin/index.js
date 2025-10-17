import axios from 'axios';

export default async function handler(req, res) {
    switch (req.method) {
        case 'POST':
            postCRUD();
            break;
        default:
            return res.status(402).end(`Method ${req.method} not allowed`);
    }

    async function postCRUD() {
        try {
            let valUpdate = '';
            req.body.page += 1;
            let body = req.body;
            if (req.headers['x-valueupdate']) {
                valUpdate = req.headers['x-valueupdate'];
            }
            if (req.headers['x-deleteindex']) {
                body = { Kode: req.headers['x-deleteindex'] };
            }
            const postData = await axios.post(process.env.API_URL + req.headers['x-endpoint'] + valUpdate, body, req.headers);
            return res.status(200).send(postData.data);
        } catch (err) {
            if (err.response.data?.message) {
                return res.status(500).json(err.response.data);
            }
            return res.status(500).json({ status: 'error' });
        }
    }
}
