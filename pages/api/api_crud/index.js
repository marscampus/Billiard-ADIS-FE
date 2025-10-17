import { getServerSession } from "next-auth/next";
import { getNextAuthOptions } from "../auth/[...nextauth]";
import axios from "axios";
import { decrypt } from "../../../utilities/encrypt";
import { destroyCookie } from "nookies";

export default async function handler(req, res) {
    //get session
    const session = await getServerSession(req, res,getNextAuthOptions(req,res));
    //check session
    if(!session){
        return res.status(402).json({ status: "session expired" });
    }
     if(!req.cookies['_A2F']){
        return res.status(401).json({'message':'nauthenticated'});
    }

    //create header from cookies
    const token = decrypt(req.cookies['_A2F']);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    switch (req.method) {
        case 'POST':
            postCRUD();
            break;
        default:
            return res.status(402).end(`Method ${req.method} not allowed`);
    }


    async function postCRUD() {
        try {
            let valUpdate = "";
            req.body.page += 1;
            let body = req.body;

            if(req?.headers['x-delete']){
                body = {
                    id: req.headers['x-delete']
                }
            }

            if(req?.headers['x-update']){
                if(req.headers['x-update'] != ''){
                    body.id = req.headers['x-update'];
                }
            }
            
            if (req.headers['x-valueupdate']) { valUpdate = req.headers['x-valueupdate'] };
            if (req.headers['x-deleteindex']) { body = { Kode: req.headers['x-deleteindex'] } };
            const result = await axios.post(process.env.API_URL + req.headers['x-endpoint'] + valUpdate, body,req.headers);
            return res.status(200).send(result.data);
        } catch (err) {
            if(err.response?.status == 401){
                const cookiesToDelete = ['_A2R', '_A2F'];
                cookiesToDelete.forEach(cookieName =>{
                    destroyCookie({ res }, cookieName , {
                        httpOnly: true,
                        secure: true, // Setel ke true jika menggunakan HTTPS di produksi
                        path: '/',
                        });
                });
                return res.status(401).json(err.response.data);
            }
            console.log(err)
            return res.status(500).json(err?.response?.data);
        }
    }

}