import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useFormik } from 'formik';
import RekeningCOA from '../../component/RekeningCOA';
import postData from '../../../lib/Axios';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function Pembiayaan() {
    const apiEndPointGet = '/api/pembayaran/get';
    const apiEndPointStore = '/api/pembayaran/store';
    const apiEndPointUpdate = '/api/pembayaran/update';
    const apiEndPointDelete = '/api/pembayaran/delete';
    const toast = useRef(null);
    const [pembayaranTabel, setPembayaranTabel] = useState([]);
    const [pembayaranTabelFilt, setPembayaranTabelFilt] = useState([]);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [dialog, setDialog] = useState({
        data: {
            id: '',
            kode: '',
            keterangan: '',
            rekening: ''
        },
        show: false,
        edit: false,
        delete: false
    });

    const onPage = (event) => {
        setlazyState(event);

        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        setFirst(event.first);
        setRows(event.rows);

        loadLazyData();
    };

    useEffect(() => {
        loadLazyData();
    }, []);

    useEffect(() => {
        setPembayaranTabelFilt(pembayaranTabel);
    }, [pembayaranTabel, lazyState]);

    const loadLazyData = async () => {
        try {
            const res = await postData(apiEndPointGet, lazyState);
            setPembayaranTabel(res.data.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle Toast
    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    //  Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button
                        label="New"
                        icon="pi pi-plus"
                        className="p-button-success mr-2"
                        onClick={() => {
                            setDialog({ data: {}, show: true, edit: false, delete: false });
                            formik.resetForm();
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                {/* <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" className="p-button-info mr-2" />
                </div> */}
            </React.Fragment>
        );
    };

    // Yang Handle Action pada Tabel
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-pencil"
                    severity="success"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setDialog({ data: rowData, show: true, edit: true, delete: false });
                        console.log(rowData);

                        formik.setValues({
                            id: rowData.id,
                            kode: rowData.kode,
                            keterangan: rowData.keterangan,
                            kode_rekening: rowData.kode_rekening,
                            ket_kode_rekening: rowData.ket_kode_rekening
                        });
                    }}
                />
                <Button icon="pi pi-trash" onClick={() => setDialog({ data: rowData, show: true, edit: false, delete: true })} severity="danger" rounded />
            </>
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
            filtered = pembayaranTabel.filter((d) => (x ? x.test(d.kode) || x.test(d.keterangan) || x.test(d.kode_rekening) : []));
            setSearch(searchVal);
        }

        setPembayaranTabelFilt(filtered);
    };

    const formik = useFormik({
        initialValues: {
            kode: '',
            keterangan: '',
            kode_rekening: '',
            ket_kode_rekening: ''
        },
        validate: (data) => {
            let errors = {};

            // Validasi kode
            if (!data.kode) {
                errors.kode = 'Kode tidak boleh kosong.';
            }

            // Validasi keterangan
            if (!data.keterangan) {
                errors.keterangan = 'Keterangan tidak boleh kosong.';
            }

            // Validasi rekening
            if (!data.kode_rekening) {
                errors.rekening = 'Rekening harus dipilih].';
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    //  Yang Handle Delete
    const handleDelete = async () => {
        try {
            const res = await postData(apiEndPointDelete, { id: dialog.data.id });
            showSuccess(res.data.message);
            setDialog({ data: {}, show: false, edit: false, delete: false });
            loadLazyData();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDialog({ data: {}, show: false, edit: false, delete: false })} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    //  Yang Handle Rekening
    const btnRekening = () => {
        setRekeningDialog(true);
    };

    const handleRekeningData = (kodeRekening, keteranganRekening, jenisRekening) => {
        if (jenisRekening == 'D') {
            formik.setFieldValue('kode_rekening', kodeRekening);
            formik.setFieldValue('ket_kode_rekening', keteranganRekening);
        } else {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Rekening Induk Tidak Dapat Dipilih',
                life: 3000
            });
        }
    };

    //  Yang Handle Save/Update
    const handleSave = async (input) => {
        try {
            let endPoint;
            if (input.id) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            // Kirim data ke server
            const vaData = await postData(endPoint, input);
            let res = vaData.data;
            showSuccess(res.data?.message || 'Berhasil Create Data');
            loadLazyData();
            formik.resetForm();
            setDialog({ data: {}, show: false, edit: false, delete: false });
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <h4>Master Pembayaran</h4>
                <div className="card">
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                    <DataTable
                        value={pembayaranTabelFilt}
                        filters={lazyState.filters}
                        header={headerSearch}
                        first={first}
                        rows={rows}
                        onPage={onPage}
                        paginator
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords}
                        size="small"
                        loading={loading}
                        className="datatable-responsive"
                        emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="kode" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="keterangan" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="kode_rekening" header="REKENING"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                </div>
            </div>
            <Dialog
                visible={dialog.show && !dialog.delete}
                header={dialog.edit ? 'Edit Data Pembayaran' : 'Tambah Data Pembayaran'}
                modal
                style={{ width: '40%' }}
                onHide={() => {
                    setDialog({ data: {}, show: false, edit: false, delete: false });
                    formik.resetForm();
                }}
            >
                <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
                    <div>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="kode">Kode</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="kode"
                                    name="kode"
                                    readOnly={dialog.edit}
                                    value={formik.values.kode}
                                    onChange={(e) => {
                                        formik.setFieldValue('kode', e.target.value);
                                    }}
                                    className={isFormFieldInvalid('kode') ? 'p-invalid' : ''}
                                />
                            </div>
                            {isFormFieldInvalid('kode') ? getFormErrorMessage('kode') : ''}
                        </div>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="keterangan">Keterangan</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="keterangan"
                                    name="keterangan"
                                    value={formik.values.keterangan}
                                    onChange={(e) => {
                                        formik.setFieldValue('keterangan', e.target.value);
                                    }}
                                    className={isFormFieldInvalid('keterangan') ? 'p-invalid' : ''}
                                />
                            </div>
                            {isFormFieldInvalid('keterangan') ? getFormErrorMessage('keterangan') : ''}
                        </div>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="rekening">Rekening</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="kodeRekening"
                                    name="KodeRekening"
                                    value={formik.values.kode_rekening} // Harus terhubung ke formik
                                    onChange={formik.handleChange}
                                    className={isFormFieldInvalid('KodeRekening') ? 'p-invalid' : ''}
                                />
                                <Button icon="pi pi-search" className="p-button" type="button" onClick={btnRekening} />
                                <InputText
                                    id="ketSatuan"
                                    name="KetKodeRekening"
                                    value={formik.values.ket_kode_rekening} // Harus terhubung ke formik
                                    disabled
                                    className={isFormFieldInvalid('KetKodeRekening') ? 'p-invalid' : ''}
                                />
                            </div>
                        </div>
                    </div>
                    <Button type="submit" className="mt-2" label={dialog.edit ? 'Update' : 'Save'} />
                </form>
            </Dialog>
            <Dialog header="Delete" visible={dialog.show && dialog.delete} onHide={() => setDialog({ data: {}, show: false, edit: false, delete: false })} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{dialog.data?.keterangan}</strong>
                    </span>
                </div>
            </Dialog>
            <RekeningCOA rekeningDialog={rekeningDialog} setRekeningDialog={setRekeningDialog} handleRekeningData={handleRekeningData}></RekeningCOA>
        </div>
    );
}
