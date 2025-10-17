import fs from 'fs-extra';
import { execFile } from 'child_process';
import path from 'path';
import util from 'util';

const execFilePromise = util.promisify(execFile);
const isValidPluginName = (name) => /^[a-zA-Z0-9-_]+$/.test(name);

const clonePluginRepo = async (pluginName, pluginDir) => {
    await execFilePromise('git', ['clone', `${process.env.GIT_REPOSITORY}/${pluginName}.git`, pluginDir]).catch((error) => {
        console.log(`Gagal meng-clone repository: ${error.message}`);
        throw error;
    });
};

const copyFiles = async (src, dest) => {
    await fs.ensureDir(dest);
    await fs.copy(src, dest);
};

const installPlugin = async (pluginName, pluginDir, dest, src, names) => {
    await clonePluginRepo(pluginName, pluginDir);

    for (const nm of names) {
        await copyFiles(src[nm], dest[nm]);
    }

    await fs.remove(pluginDir);
};

const handler = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.REGISTER_URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // ngecek prefligt request jika method di ijinkan maka akan melanjutkan pengecekan dibawahnya
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ngecek jika method yang masuk itu post
    if (req.method === 'POST') {
        const { pluginName } = req.body;

        // ngecek jika nama plugin itu valid dan bukan ciri ciri command injection
        if (!pluginName || !isValidPluginName(pluginName)) {
            return res.status(400).json({ error: 'Kesalahan pada nama plugin' });
        }

        // jika git repo belum di atur
        if (!process.env.GIT_REPOSITORY) {
            return res.status(500).json({ error: 'git repo tidak di atur' });
        }

        try {
            const pluginDir = path.resolve(process.cwd(), `../${pluginName}`);

            const names = ['pages', 'component'];

            const dest = {
                pages: path.resolve(process.cwd(), `./pages/plugin/${pluginName}`),
                component: path.resolve(process.cwd(), `./component/plugin/${pluginName}`)
            };

            const src = {
                pages: path.resolve(process.cwd(), `../${pluginName}/pages/plugin/${pluginName}`),
                component: path.resolve(process.cwd(), `../${pluginName}/component/plugin/${pluginName}`)
            };

            const isPathExist = await fs.pathExists(dest.pages);

            await installPlugin(pluginName, pluginDir, dest, src, names);

            if (isPathExist) {
                return res.status(200).json({
                    message: `Plugin ${pluginName} berhasil di update`
                });
            }
            return res.status(200).json({ message: `Plugin ${pluginName} berhasil diinstall` });
        } catch (error) {
            return res.status(500).json({ error: `Gagal menginstall plugin: ${error.message}` });
        }
    }

    return res.status(405).json({ error: 'Metode tidak diizinkan' });
};

export default handler;
