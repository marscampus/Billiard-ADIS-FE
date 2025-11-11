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
    const apiEndPointGet = '/api/kamar/get';
    const apiEndPointStore = '/api/kamar/store';
    const apiEndPointUpdate = '/api/kamar/update';
    const apiEndPointDelete = '/api/kamar/delete';
    const apiEndPointGetKodeKamar = '/api/get_kode-kamar';
    const apiEndPointGetTipeKamar = '/api/tipekamar/get';
    const apiEndPointGetFasilitasKamar = '/api/fasilitaskamar/get';
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
    const [tipeKamarOptions, setTipeKamarOptions] = useState([]);
    const [fasilitasKamarOptions, setFasilitasKamarOptions] = useState([]);
    const [selectedFasilitasKamar, setSelectedFasilitasKamar] = useState([]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        getTipeKamar();
        loadLazyData();
        getFasilitasKamar();
    }, []);

    useEffect(() => {
        setKamarTabelFilt(kamarTabel);
    }, [kamarTabel, lazyState]);

    const getKodeKamar = async () => {
        try {
            let requestBody = {
                Key: 'R',
                Len: 5
            };
            const vaData = await postData(apiEndPointGetKodeKamar, requestBody);
            const json = vaData.data;
            formik.setValues((prev) => ({
                ...prev,
                kode_kamar: json
            }));
        } catch (error) {
            console.log(error);
        }
    };

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
        // loadLazyData();
    };

    const getTipeKamar = async () => {
        const vaData = await postData(apiEndPointGetTipeKamar, lazyState);
        const data = vaData.data.data;
        const formattedOptions = data.map((item) => ({
            label: item.keterangan,
            value: item.kode
        }));

        // Set the formatted options to the state
        setTipeKamarOptions(formattedOptions);
    };

    const getFasilitasKamar = async () => {
        const vaData = await postData(apiEndPointGetFasilitasKamar, lazyState);
        const data = vaData.data.data;

        // Map the data into the desired format for the checkboxes
        const formattedOptions = data.map((item) => ({
            name: item.keterangan,
            key: item.kode
        }));

        // Set the formatted options to the state
        setFasilitasKamarOptions(formattedOptions);
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
            setKamarTabel(json.data);
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
                            kode_kamar: rowData.kode_kamar,
                            no_kamar: rowData.no_kamar,
                            harga: rowData.harga,
                            tipe: rowData.tipe_kamar,
                            fasilitas: rowData.fasilitas,
                            foto: rowData.foto,
                            per_harga: rowData.per_harga
                        });
                        setSelectedFasilitasKamar(fasilitasKamarOptions.filter((option) => rowData.fasilitas.includes(option.key)));
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
                            getKodeKamar();
                            setSelectedFasilitasKamar([]);
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
            filtered = kamarTabel.filter((d) => (x ? x.test(d.kode_kamar) || x.test(d.no_kamar) || x.test(d.harga) : []));
            setSearch(searchVal);
        }

        setKamarTabelFilt(filtered);
    };

    //  Yang Handle Inputan File
    const onFileSelect = (event) => {
        const file = event.files[0]; // Ambil file pertama dari FileUpload
        if (file.size > 900000) {
            // formik.setValues((prev) => ({
            //     ...prev,
            //     foto: null
            // }));
            formik.setFieldValue('foto', null);
            return showError('File tidak boleh lebih dari 1MB.');
        }
        const reader = new FileReader();

        reader.onload = (e) => {
            formik.setFieldValue('foto', e.target.result);
            // formik.setValues((prev) => ({
            //     ...prev,
            //     foto: e.target.result
            // }));
        };

        if (file) {
            reader.readAsDataURL(file); // Konversi file ke base64
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

    //  Yang Handle CheckBox
    const onFasilitasKamarChange = (e) => {
        const selectedCategory = e.value;
        let updatedFasilitas;

        if (e.checked) {
            // Tambahkan fasilitas yang dipilih
            updatedFasilitas = [...selectedFasilitasKamar, selectedCategory];
        } else {
            // Hapus fasilitas yang tidak dipilih
            updatedFasilitas = selectedFasilitasKamar.filter((item) => item.key !== selectedCategory.key);
        }

        setSelectedFasilitasKamar(updatedFasilitas);

        formik.setValues((prev) => ({
            ...prev,
            fasilitas: updatedFasilitas.map((item) => item.key) // Simpan hanya key
        }));
    };

    //  Yang Handle Validasi Data
    const formik = useFormik({
        initialValues: {
            id: '',
            kode_kamar: '',
            no_kamar: '',
            harga: '',
            tipe: '',
            fasilitas: [],
            foto: '',
            per_harga: 'Jam'
        },
        validate: (data) => {
            let errors = {};
            !data.kode_kamar && (errors.kode_kamar = 'Kode Meja tidak boleh kosong.');
            !data.no_kamar && (errors.no_kamar = 'No. Meja tidak boleh kosong.');
            !data.harga && (errors.harga = 'Harga tidak boleh kosong.');
            !data.tipe && (errors.tipe = 'Tipe Meja belum dipilih.');
            !data.per_harga && (errors.per_harga = 'Per Waktu Meja belum dipilih.');
            !data.fasilitas || (data.fasilitas.length < 1 && (errors.fasilitas = 'Fasilitas Meja belum dipilih.'));
            if (!dialog.edit) {
                !data.foto && (errors.foto = 'Foto tidak boleh kosong.');
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

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <h4>Master Meja</h4>
                <Toast ref={toast}></Toast>
                <hr></hr>
                <div className="card">
                    <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                    <DataTable
                        value={kamarTabelFilt}
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
                        <Column headerStyle={{ textAlign: 'center' }} field="kode_kamar" header="KODE MEJA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="no_kamar" header="NO. MEJA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="ket_tipe" header="TIPE MEJA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="ket_fasilitas" header="FASILITAS"></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="harga"
                            body={(rowData) => {
                                const value = rowData.harga ? rupiahConverter(rowData.harga) : 0;
                                return (
                                    <div>
                                        {value}/{rowData.per_harga}
                                    </div>
                                );
                            }}
                            header="HARGA"
                        ></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="foto" body={imageBodyTemplate} header="FOTO"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                </div>
            </div>
            <Dialog
                visible={dialog.show && !dialog.delete}
                header={dialog.edit ? 'Edit Data Meja' : 'Tambah Data Meja'}
                modal
                style={{ width: '70%' }}
                onHide={() => {
                    setDialog({ data: {}, show: false, edit: false, delete: false });
                    formik.resetForm();
                }}
            >
                <form onSubmit={formik.handleSubmit} className="flex gap-2 flex-column">
                    <div className="grid">
                        <div className="flex flex-column gap-2 col-8">
                            <div className="flex gap-2 w-full">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="kode_meja">Kode Meja</label>
                                    <div className="p-inputgroup">
                                        <InputText id="kode_meja" name="kode_meja" value={formik.values.kode_kamar} readOnly className={isFormFieldInvalid('kode_kamar') ? 'p-invalid' : ''} />
                                    </div>
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="nokamar">Meja</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            id="no_kamar"
                                            name="no_kamar"
                                            value={formik.values.no_kamar}
                                            onChange={(e) => {
                                                formik.setFieldValue('no_kamar', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('no_kamar') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('no_kamar') ? getFormErrorMessage('no_kamar') : ''}
                                </div>
                            </div>
                            <div className="flex gap-2 w-full">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="harga">Harga</label>
                                    <div className="p-inputgroup">
                                        <InputNumber
                                            inputStyle={{ textAlign: 'right' }}
                                            id="harga"
                                            name="harga"
                                            value={formik.values.harga}
                                            onChange={(e) => {
                                                formik.setFieldValue('harga', e.value);
                                            }}
                                            className={isFormFieldInvalid('harga') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('harga') ? getFormErrorMessage('harga') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="per_harga">Per</label>
                                    <div className="p-inputgroup">
                                        <Dropdown
                                            inputStyle={{ textAlign: 'right' }}
                                            id="per_harga"
                                            name="per_harga"
                                            options={['Jam', 'Event']}
                                            value={formik.values.per_harga}
                                            onChange={(e) => {
                                                formik.setFieldValue('per_harga', e.value);
                                            }}
                                            className={isFormFieldInvalid('per_harga') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('per_harga') ? getFormErrorMessage('per_harga') : ''}
                                </div>
                            </div>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="tipe">Tipe Meja</label>
                                <Dropdown
                                    id="tipe"
                                    value={formik.values.tipe}
                                    options={tipeKamarOptions}
                                    onChange={(e) => {
                                        formik.setFieldValue('tipe', e.target.value);
                                    }}
                                    optionLabel="label"
                                    optionValue="value"
                                    className={isFormFieldInvalid('tipe') ? 'p-invalid' : ''}
                                />
                                {isFormFieldInvalid('tipe') ? getFormErrorMessage('tipe') : ''}
                            </div>
                            <div className="flex flex-column gap-2">
                                <label
                                    htmlFor="fasilit
                                asKamar"
                                >
                                    Fasilitas Meja
                                </label>
                                <div className="p-inputgroup">
                                    <div className="flex flex-wrap gap-6">
                                        {fasilitasKamarOptions.map((category) => {
                                            return (
                                                <div key={category.key} className="flex align-items-center w-1/3">
                                                    <Checkbox inputId={category.key} name="category" value={category} onChange={onFasilitasKamarChange} checked={selectedFasilitasKamar.some((item) => item.key === category.key)} />
                                                    <label htmlFor={category.key} className="ml-2">
                                                        {category.name}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {isFormFieldInvalid('fasilitas') ? getFormErrorMessage('fasilitas') : ''}
                            </div>
                        </div>
                        <div className="flex flex-column gap-2 col-4">
                            <label htmlFor="foto">Foto</label>
                            {!formik.values.foto && <FileUpload name="foto" key={formik.values.foto} accept="image/*" customUpload mode="basic" chooseLabel="Pilih Foto" auto={false} onSelect={onFileSelect} />}
                            {formik.values.foto && (
                                <div className="mt-2" style={{ position: 'relative' }}>
                                    <img src={formik.values.foto} alt="Preview Foto" className="mb-3" style={{ width: '300px', height: '300px', objectFit: 'cover', objectPosition: 'center' }} />
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
                    <Button type="submit" label={dialog.edit ? 'Update' : 'Save'} />
                </form>
            </Dialog>

            <Dialog header="Delete" visible={dialog.show && dialog.delete} onHide={() => setDialog({ data: {}, show: false, edit: false, delete: false })} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{dialog.data?.kode_kamar}</strong>
                    </span>
                </div>
            </Dialog>
        </div>
    );
}
