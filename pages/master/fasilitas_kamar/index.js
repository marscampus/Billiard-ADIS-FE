import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import postData from '../../../lib/Axios';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import Image from 'next/image';
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

export default function FasilitasKamar() {
    const apiEndPointGet = '/api/fasilitaskamar/get';
    const apiEndPointStore = '/api/fasilitaskamar/store';
    const apiEndPointUpdate = '/api/fasilitaskamar/update';
    const apiEndPointDelete = '/api/fasilitaskamar/delete';
    const toast = useRef(null);
    const [fasilitasKamarTabel, setFasilitasKamarTabel] = useState([]);
    const [fasilitasKamarTabelFilt, setFasilitasKamarTabelFilt] = useState([]);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
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
            deskripsi: '',
            foto: ''
        },
        show: false,
        edit: false,
        delete: false
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setFasilitasKamarTabelFilt(fasilitasKamarTabel);
    }, [fasilitasKamarTabel, lazyState]);

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
            setFasilitasKamarTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData(apiEndPointDelete, { id: dialog.data.id });
            showSuccess(res.data.message);
            loadLazyData();

            setDialog({ data: {}, show: false, edit: false, delete: false });
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
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
                            deskripsi: rowData.deskripsi,
                            keterangan: rowData.keterangan,
                            foto: rowData.foto
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
            filtered = fasilitasKamarTabel.filter((d) => (x ? x.test(d.kode) || x.test(d.keterangan) || x.test(d.deskripsi) : []));
            setSearch(searchVal);
        }

        setFasilitasKamarTabelFilt(filtered);
    };

    //  Yang Handle Inputan File
    const onFileSelect = (event) => {
        const file = event.files[0];
        if (file.size > 900000) {
            formik.setFieldValue('foto', null);
            return showError('File tidak boleh lebih dari 1MB.');
        }
        const reader = new FileReader();

        reader.onload = (e) => {
            formik.setFieldValue('foto', e.target.result);
        };

        if (file) {
            reader.readAsDataURL(file);
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

    const formik = useFormik({
        initialValues: {
            kode: '',
            keterangan: '',
            deskripsi: '',
            foto: ''
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

            // Validasi foto
            if (!data.foto) {
                errors.foto = 'Foto harus diunggah.';
            }

            return errors;
        },
        onSubmit: (data) => {
            console.log(data);
            handleSave(data);
        }
    });

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
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
                <h4>Master Fasilitas Kamar</h4>
                <div className="card">
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                    <DataTable
                        value={fasilitasKamarTabelFilt}
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
                        <Column headerStyle={{ textAlign: 'center' }} field="deskripsi" header="DESKRIPSI"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="foto" body={imageBodyTemplate} header="FOTO"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                </div>
            </div>
            <Dialog
                visible={dialog.show && !dialog.delete}
                header={dialog.edit ? 'Edit Data Fasilitas' : 'Tambah Data Fasilitas'}
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
                            {isFormFieldInvalid('deskripsi') ? getFormErrorMessage('deskripsi') : ''}
                        </div>

                        <div className="flex flex-column gap-2" style={{ width: '100%' }}>
                            <label htmlFor="foto">Foto</label>
                            {!formik.values.foto && <FileUpload key={formik.values.foto} name="foto" accept="image/*" style={{ width: '100%' }} customUpload mode="basic" chooseLabel="Pilih Foto" auto={false} onSelect={onFileSelect} />}
                            {formik.values.foto && (
                                <div className="mt-2" style={{ position: 'relative' }}>
                                    <img src={formik.values.foto} alt="Preview Foto" className="mb-3" style={{ width: '100%', height: '300px', objectFit: 'cover', objectPosition: 'center' }} />
                                    <Button
                                        // label="Hapus Foto"
                                        icon="pi pi-trash"
                                        className="p-button-danger"
                                        style={{ position: 'absolute', top: '0', right: '0' }}
                                        onClick={() => {
                                            formik.setValues((prev) => ({
                                                ...prev,
                                                foto: null
                                            }));
                                        }}
                                    />
                                </div>
                            )}
                            {isFormFieldInvalid('foto') ? getFormErrorMessage('foto') : ''}
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
        </div>
    );
}
