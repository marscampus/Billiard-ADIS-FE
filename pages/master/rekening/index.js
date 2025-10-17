import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useFormik } from 'formik';
import { RadioButton } from 'primereact/radiobutton';
import { Dropdown } from 'primereact/dropdown';
import postData from '../../../lib/Axios';
import { TabPanel, TabView } from 'primereact/tabview';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function Rekening() {
    const apiEndPointGet = '/api/rekening/get';
    const apiEndPointStore = '/api/rekening/store';
    const apiEndPointUpdate = '/api/rekening/update';
    const apiEndPointDelete = '/api/rekening/delete';
    const toast = useRef(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [loading, setLoading] = useState(false);
    const [rekeningTabel, setRekeningTabel] = useState([]);
    const [rekeningTabelFilt, setRekeningTabelFilt] = useState([]);
    const [search, setSearch] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const tipeRekeningOptions = [
        { name: '1.', label: 'Aset' },
        { name: '2.', label: 'Kewajiban' },
        { name: '3.', label: 'Modal' },
        { name: '4.', label: 'Pendapatan' },
        { name: '5.', label: 'Biaya' },
        { name: '6.', label: 'Administratif' }
    ];
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
            tipe_rekening: '',
            kode: '',
            keterangan: '',
            jenis_rekening: ''
        },
        show: false,
        edit: false,
        delete: false
    });

    const [dataRekening, setDataRekening] = useState({
        data: [],
        load: false,
        filterValue: '',
        filteredData: []
    });

    const vaRadioButton = [
        {
            id: 'induk',
            name: 'I',
            value: 'Induk',
            inputId: 'f1'
        },
        {
            id: 'detail',
            name: 'D',
            value: 'Detail',
            inputId: 'f2'
        }
    ];

    useEffect(() => {
        loadLazyData();
    }, []);

    useEffect(() => {
        setRekeningTabelFilt(rekeningTabel);
    }, [rekeningTabel, lazyState]);

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

        // loadLazyData();
    };

    //  Yang Handle Toast
    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const loadLazyData = async () => {
        setDataRekening((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData(apiEndPointGet, lazyState);
            setDataRekening((prev) => ({ ...prev, data: res.data.data, load: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataRekening((prev) => ({ ...prev, data: [], load: false }));
        }
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

    // Yang Handle Search
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search..." value={dataRekening.filterValue} onChange={(e) => filterSearch(e.target.value)} />
                </span>
            </div>
        </div>
    );

    const filterSearch = (searchVal) => {
        const regex = searchVal ? new RegExp(searchVal, 'i') : null;

        // Jika tidak ada teks pencarian, kembalikan data asli
        const filtered = !searchVal
            ? dataRekening.data
            : dataRekening.data.map((item) => ({
                  ...item,
                  detail: regex ? item.detail.filter((k) => regex.test(k.kode) || regex.test(k.keterangan)) : item.detail
              }));

        setDataRekening((prev) => ({
            ...prev,
            filteredData: filtered,
            filterValue: searchVal
        }));
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
                        const tipeRekening = rowData.kode.split('.')[0] + '.';
                        formik.setValues({
                            id: rowData.id,
                            tipe_rekening: tipeRekening,
                            kode: rowData.kode,
                            keterangan: rowData.keterangan,
                            jenis_rekening: rowData.jenis_rekening
                        });
                    }}
                />
                <Button icon="pi pi-trash" onClick={() => setDialog({ data: rowData, show: true, edit: false, delete: true })} severity="danger" rounded />
            </>
        );
    };

    const formik = useFormik({
        initialValues: {
            id: '',
            tipe_rekening: '',
            kode: '',
            keterangan: '',
            jenis_rekening: ''
        },
        validate: (data) => {
            let errors = {};
            //  Validasi tipe rekening
            if (!data.tipe_rekening) {
                errors.tipe_rekening = 'Tipe Rekening belum dipilih.';
            }

            // Validasi kode
            if (!data.kode) {
                errors.kode = 'Kode tidak boleh kosong.';
            }

            // Validasi keterangan
            if (!data.keterangan) {
                errors.keterangan = 'Keterangan tidak boleh kosong.';
            }

            // Validasi jenis rekening
            if (!data.jenis_rekening) {
                errors.rekening = 'Jenis Rekening belum dipilih.';
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    useEffect(() => {
        console.log('Formik values:', formik.values);
    }, [formik.values]);

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

    //  Yang Handle Save/Update
    const handleSave = async (input) => {
        try {
            const rekening = `${input.tipe_rekening}${input.kode}`;
            const modifiedInput = { ...input, rekening };
            let endPoint;
            if (input.id) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            // Kirim data ke server
            const vaData = await postData(endPoint, modifiedInput);
            let res = vaData.data;
            console.log(res);
            loadLazyData();
            showSuccess(res?.message || 'Berhasil Create Data');
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
            <Toast ref={toast}></Toast>
            <div className="col-12">
                <div className="card">
                    <h4>Master Rekening</h4>
                    <hr></hr>
                    <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                    <TabView>
                        {(dataRekening.filterValue ? dataRekening.filteredData : dataRekening.data).map((item, index) => {
                            return (
                                <TabPanel key={index} header={item.tipe_rekening}>
                                    <DataTable
                                        value={item.detail}
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
                                        loading={dataRekening.load}
                                        className="datatable-responsive"
                                        emptyMessage="Data Kosong"
                                    >
                                        <Column headerStyle={{ textAlign: 'center' }} field="kode" header="KODE"></Column>
                                        <Column headerStyle={{ textAlign: 'center' }} field="keterangan" header="KETERANGAN"></Column>
                                        <Column headerStyle={{ textAlign: 'center' }} field="jenis_rekening" header="JENIS REKENING" body={(rowData) => (rowData.jenis_rekening === 'I' ? 'Induk' : 'Detail')}></Column>
                                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                                    </DataTable>
                                </TabPanel>
                            );
                        })}
                    </TabView>
                </div>
            </div>
            <Dialog
                visible={dialog.show && !dialog.delete}
                header={dialog.edit ? 'Edit Data Rekening' : 'Tambah Data Rekening'}
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
                                <Dropdown
                                    id="tipe_rekening"
                                    disabled={dialog.edit}
                                    value={formik.values.tipe_rekening}
                                    options={tipeRekeningOptions}
                                    onChange={(e) => {
                                        formik.setFieldValue('tipe_rekening', e.target.value);
                                    }}
                                    optionLabel="label"
                                    optionValue="name"
                                    className={isFormFieldInvalid('tipe_rekening') ? 'p-invalid' : ''}
                                />
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
                            <label htmlFor="jenis_rekening">Jenis Rekening</label>
                            <div className="p-inputgroup">
                                <div className="flex flex-wrap gap-6">
                                    {vaRadioButton.map((btn, i) => {
                                        return (
                                            <div key={i} className="flex align-items-center mr-3">
                                                <RadioButton
                                                    {...btn}
                                                    checked={formik.values.jenis_rekening === btn.name}
                                                    onChange={(e) => {
                                                        formik.setFieldValue('jenis_rekening', e.target.name);
                                                    }}
                                                />
                                                <label htmlFor={btn.inputId} className="ml-1">
                                                    {btn.value}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {isFormFieldInvalid('jenis_rekening') ? getFormErrorMessage('jenis_rekening') : ''}
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
