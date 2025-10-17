import React, { useState, useEffect } from 'react';
import postData from '../../lib/Axios';
import { Tag } from 'primereact/tag';

function AntrianPage() {
    const apiEndPointGet = '/api/antrian-meja/get';
    const [kamarTabel, setKamarTabel] = useState([]);

    const loadLazyData = async () => {
        try {
            console.log('API ter hit')
            const response = await postData(apiEndPointGet, {});
            const json = response.data;
            setKamarTabel(json.data || []);
        } catch (error) {
            console.error(error?.response?.data || error);
        }
    };

    useEffect(() => {
        loadLazyData();
        const interval = setInterval(() => {
            loadLazyData();
        }, 10000); // refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusTag = (status) => {
        if (status == '0') {
            return <Tag severity="success" value="Kosong" className="text-lg py-2 px-4 border-round-lg" />;
        } else {
            return <Tag severity="danger" value="Terpakai" className="text-lg py-2 px-4 border-round-lg" />;
        }
    };

    return (
        <div className="h-screen flex justify-content-center align-items-start bg-primary-reverse p-4">
            <div className="w-11 md:w-9 lg:w-8 xl:w-7 card shadow-3 border-round-xl p-4">
                <h1 className="text-center mb-5 text-primary font-bold text-4xl">Status Meja</h1>

                <div className="grid justify-content-center">
                    {kamarTabel.map((item, index) => (
                        <div key={index} className="col-12 sm:col-6 md:col-4 lg:col-3 p-3">
                            <div
                                className={`border-round-2xl p-5 text-center surface-card shadow-3 transition-duration-300 hover:shadow-5`}
                                style={{
                                    border: item.status != '0' ? '6px solid #ef4444' : '6px solid #22c55e',
                                    background: item.status != '0' ? '#fee2e2' : '#dcfce7',
                                    height: '200px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <h2 className="m-0 mb-3 font-bold text-3xl">{item.kode_meja}</h2>
                                {getStatusTag(item.status)}
                            </div>
                        </div>
                    ))}

                    {kamarTabel.length === 0 && (
                        <div className="col-12 text-center text-500 py-6 text-xl">
                            Tidak ada data meja ditemukan.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

AntrianPage.getLayout = function AntrianPage(page) {
    return <>{page}</>;
};

export default AntrianPage;
