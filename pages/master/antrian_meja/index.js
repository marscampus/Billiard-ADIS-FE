import { Button } from 'primereact/button';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import Image from 'next/image';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Column } from 'primereact/column';
import { FileUpload } from 'primereact/fileupload';
import postData from '../../../lib/Axios';
import { InputNumber } from 'primereact/inputnumber';
import { rupiahConverter } from '../../../component/GeneralFunction/GeneralFunction';
import { useFormik } from 'formik';
import { Badge } from 'primereact/badge';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function Kamar() {
    const apiEndPointGet = '/api/antrian-meja/get';
    const apiEndPointUpdate = '/api/antrian-meja/update';
    const toast = useRef(null);
    const [kamarTabel, setKamarTabel] = useState([]);
    const [kamarTabelFilt, setKamarTabelFilt] = useState([]);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [dialog, setDialog] = useState({
        data: {
            id: '',
            kode_kamar: '',
            no_kamar: '',
            harga: '',
            tipe: '',
            fasilitas: [],
            foto: ''
        },
        show: false,
        edit: false,
        delete: false
    });

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        loadLazyData();
    }, []);

    useEffect(() => {
        setKamarTabelFilt(kamarTabel);
    }, [kamarTabel, lazyState]);

    //  Yang Handle Toast
    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGet, lazyState);
            const json = vaTable.data;
            console.log(json)
            setTotalRecords(json.data.length);
            setKamarTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                {/* <div className="my-2"> */}
                {/*     <Button */}
                {/*         label="New" */}
                {/*         icon="pi pi-plus" */}
                {/*         className="mr-2" */}
                {/*         onClick={() => { */}
                {/*             setDialog({ data: {}, show: true, edit: false, delete: false }); */}
                {/*             getKodeKamar(); */}
                {/*             setSelectedFasilitasKamar([]); */}
                {/*         }} */}
                {/*     /> */}
                {/* </div> */}
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <a href='/antrian' target='_blank' className="p-button p-button-info mr-2" >
                        <i className='pi pi-ticket mr-2'></i>
                        Display
                    </a>
                </div>
            </React.Fragment>
        );
    };

    // Yang Handle Search
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = kamarTabel.filter((d) => (x ? x.test(d.kode_kamar) || x.test(d.no_kamar) || x.test(d.harga) : []));
            setSearch(searchVal);
        }

        setKamarTabelFilt(filtered);
    };


    const handleToggleStatus = async (rowData) => {
        try {
            const newStatus = rowData.status == 0 ? 1 : 0;
            const payload = {
                kode_meja: rowData.kode_meja,
                status: newStatus
            };

            const response = await postData(apiEndPointUpdate, payload);

            console.log(response)

            showSuccess(`Status meja ${rowData.kode_meja} diubah menjadi ${newStatus === 1 ? 'Digunakan' : 'Tersedia'}`);

            setKamarTabel((prev) =>
                prev.map((item) =>
                    item.kode_meja === rowData.kode_meja
                        ? { ...item, status: newStatus }
                        : item
                )
            );

        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Gagal mengubah status meja');
        }
    };

    //  Yang Handle Gambar
    const imageBodyTemplate = (rowData) => {
        return (
            <>
                <Image
                    src={rowData.foto || `/layout/images/no_img.jpg`}
                    width={100}
                    height={100}
                    style={{
                        borderRadius: '6px',
                        height: '80px',
                        width: '80px',
                        objectPosition: 'center',
                        objectFit: 'cover',
                        boxShadow: '0px 0px 3px 1px rgba(107,102,102,0.35)'
                    }}
                />
            </>
        );
    };

    return (
        <div className="grid crud-demo">
            <Toast ref={toast}></Toast>
            <div className="col-12">
                <div className="card">
                    <h4>Master Meja</h4>
                </div>
                <hr></hr>
                <div className="card">
                    <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>

                    <DataTable value={kamarTabel}>
                        <Column field='kode_meja' header="KODE MEJA" />
                        <Column field='no_meja' header="NO MEJA" />
                        <Column
                            field="status"
                            header="STATUS"
                            body={(rowData) => (
                                <Badge
                                    value={rowData.status == 0 ? 'Tersedia' : 'Digunakan'}
                                    size="large"
                                    severity={rowData.status == 0 ? 'success' : 'danger'}
                                    className="cursor-pointer select-none"
                                    onClick={() => handleToggleStatus(rowData)}
                                />
                            )}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}
