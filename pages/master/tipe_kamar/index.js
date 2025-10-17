import React, { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import postData from '../../../lib/Axios';
import { InputTextarea } from 'primereact/inputtextarea';
import { useFormik } from 'formik';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function TipeKamar() {
    const apiEndPointGet = '/api/tipekamar/get';
    const apiEndPointStore = '/api/tipekamar/store';
    const apiEndPointUpdate = '/api/tipekamar/update';
    const apiEndPointDelete = '/api/tipekamar/delete';
    const toast = useRef(null);
    const [tipeKamar, setTipeKamar] = useState([]);
    const [tipeKamarTabel, setTipeKamarTabel] = useState([]);
    const [tipeKamarTabelFilt, setTipeKamarTabelFilt] = useState([]);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [tipeKamarDialog, setTipeKamarDialog] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [dialog, setDialog] = useState({
        data: {
            id: '',
            kode: '',
            keterangan: '',
            deskripsi: ''
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
    }, [lazyState]);

    useEffect(() => {
        setTipeKamarTabelFilt(tipeKamarTabel);
    }, [tipeKamarTabel, lazyState]);

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };

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
            setTotalRecords(json.data.length);
            setTipeKamarTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setLoading(false);
        } finally {
            setLoading(false);
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
                        formik.setValues({
                            id: rowData.id,
                            kode: rowData.kode,
                            keterangan: rowData.keterangan,
                            deskripsi: rowData.deskripsi
                        });
                    }}
                />
                <Button icon="pi pi-trash" onClick={() => setDialog({ data: rowData, show: true, edit: false, delete: true })} severity="danger" rounded />
            </>
        );
    };

    //  Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button
                        label="New"
                        icon="pi pi-plus"
                        className="mr-2"
                        onClick={() => {
                            setDialog({ data: {}, show: true, edit: false, delete: false });
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
            filtered = tipeKamarTabel.filter((d) => (x ? x.test(d.kode) || x.test(d.keterangan) || x.test(d.deskripsi) : []));
            setSearch(searchVal);
        }

        setTipeKamarTabelFilt(filtered);
    };

    //  Yang Handle Validasi Data
    const formik = useFormik({
        initialValues: {
            id: '',
            kode: '',
            keterangan: '',
            deskripsi: ''
        },
        validate: (data) => {
            let errors = {};
            !data.kode && (errors.kode = 'Kode tidak boleh kosong.');
            !data.keterangan && (errors.keterangan = 'Keterangan tidak boleh kosong.');

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

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Master Tipe Kamar</h4>
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                    <DataTable
                        value={tipeKamarTabelFilt}
                        filters={lazyState.filters}
                        header={headerSearch}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
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
                        <Column headerStyle={{ textAlign: 'center' }} field="deskripsi" header="DESKRIPSI"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                </div>
            </div>
            {/* Dialog Form */}
            <Dialog
                visible={dialog.show && !dialog.delete}
                header={dialog.edit ? 'Edit Data Tipe Kamar' : 'Tambah Data Tipe Kamar'}
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
                            <label htmlFor="deskripsi">Deskripsi</label>
                            <div className="p-inputgroup">
                                <InputTextarea
                                    id="deskripsi"
                                    name="deskripsi"
                                    value={formik.values.deskripsi}
                                    onChange={(e) => {
                                        formik.setFieldValue('deskripsi', e.target.value);
                                    }}
                                    className={isFormFieldInvalid('deskripsi') ? 'p-invalid' : ''}
                                />
                            </div>
                        </div>
                    </div>
                    <Button type="submit" label={dialog.edit ? 'Update' : 'Save'} />
                </form>
            </Dialog>

            <Dialog header="Delete" visible={dialog.show && dialog.delete} onHide={() => setDialog({ data: {}, show: false, edit: false, delete: false })} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{dialog.data?.kode}</strong>
                    </span>
                </div>
            </Dialog>
        </div>
    );
}
