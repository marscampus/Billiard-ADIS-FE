import fs from 'fs-extra';
import path from 'path';

const uninstallPlugin = async (dest, names) => {
    for (const nm of names) {
        await fs.remove(dest[nm]);
    }
};

const handler = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.REGISTER_URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method == 'POST') {
        const { pluginName } = req.body;

        if (!pluginName) {
            return res.status(404).json({ error: 'Kesalahan pada nama plugin' });
        }

        try {
            // Direktori
            const names = ['pages', 'component'];
            const dest = {
                pages: path.resolve(process.cwd(), `./pages/plugin/${pluginName}`),
                component: path.resolve(process.cwd(), `./component/plugin/${pluginName}`)
            };

            // Hapus plugin
            await uninstallPlugin(dest, names);

            res.status(200).json({
                message: `Berhasil menghapus plugin ${pluginName}`
            });
        } catch (error) {
            res.status(500).json({
                error: `Gagal uninstall plugin ${pluginName} karena ${error.message}`
            });
        }
    }
};

export default handler;
