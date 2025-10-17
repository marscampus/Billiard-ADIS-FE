import QRCode from 'qrcode';
import { SignJWT } from 'jose';

const SECRET_KEY = process.env.MENU_TOKEN;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id_user, id_plugin } = req.body;
    // return res.status(200).json({ message: req.body });

    if (!id_user || !id_plugin) {
        return res.status(400).json({ message: 'id_users or id_plugin not found' });
    }

    try {
        const payload = { orderdata: `${id_user}/${id_plugin}` };

        const jwt = await new SignJWT(payload).setProtectedHeader({ alg: 'HS512' }).sign(Buffer.from(SECRET_KEY, 'utf-8'));

        const urlResto = `https://menu-kasir.godong.id/auth/${jwt}`;

        const qrUrl = await QRCode.toDataURL(urlResto, { width: 200 });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename=qrcode-resto.png');

        res.send({ qrCode: qrUrl });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
