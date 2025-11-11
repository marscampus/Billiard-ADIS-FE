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
    const toast = useRef(null);
    const [fasilitasKamar, setFasilitasKamar] = useState([]);
    const [fasilitasKamarTabel, setFasilitasKamarTabel] = useState([]);
    const [fasilitasKamarTabelFilt, setFasilitasKamarTabelFilt] = useState([]);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [fasilitasKamarDialog, setFasilitasKamarDialog] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
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
        setFasilitasKamarTabelFilt(fasilitasKamarTabel);
    }, [fasilitasKamarTabel, lazyState]);

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
            setFasilitasKamarTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Save/Update
    const saveData = async (e) => {
        setLoading(true); // Menampilkan indikator loading
        try {
            let endPoint;

            // Tentukan endpoint berdasarkan mode
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate; // Ganti dengan endpoint update
            } else {
                endPoint = apiEndPointStore; // Endpoint untuk menyimpan data baru
            }

            // Kirim data ke server
            const vaData = await postData(endPoint, fasilitasKamar);
            let data = vaData.data;
            showSuccess(data.data?.message || 'Berhasil Menambah Data');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Action pada Tabel
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" />
                <Button icon="pi pi-trash" severity="warning" rounded />
            </>
        );
    };

    //  Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
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

    //  Yang Handle Dialog Footer
    const fasilitasKamarFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveData} />
        </>
    );

    //  Yang Handle Buka Form
    const openNew = () => {
        setFasilitasKamar([]);
        setFasilitasKamarDialog(true);
        setIsUpdateMode(false);
    };

    //  Yang Handle Inputan Karakter
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...fasilitasKamar };
        _data[`${name}`] = val;
        setFasilitasKamar(_data);
    };

    //  Yang Handle Inputan File
    const onFileSelect = (event) => {
        const file = event.files && event.files[0]; // Ambil file pertama yang dipilih
        if (file) {
            // Membaca file dan menampilkan sebagai preview gambar
            const reader = new FileReader();
            reader.onloadend = () => {
                setFasilitasKamar({
                    ...fasilitasKamar,
                    foto: reader.result // Menyimpan URL base64 gambar
                });
            };
            reader.readAsDataURL(file); // Membaca file sebagai base64
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

    const clearFile = () => {
        setFasilitasKamar((prevState) => ({
            ...prevState,
            Foto: '' // Reset foto
        }));
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <h4>Master Fasilitas Meja</h4>
                <div className="card">
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                    <DataTable
                        value={fasilitasKamarTabelFilt}
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
                        <Column headerStyle={{ textAlign: 'center' }} field="foto" body={imageBodyTemplate} header="FOTO"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                </div>
            </div>
            <Dialog visible={fasilitasKamarDialog} header="Form Fasilitas Kamar" modal className="p-fluid" footer={fasilitasKamarFooter} onHide={() => setFasilitasKamarDialog(false)}>
                <div className="formgrid grid">
                    <div className="field col-12 mb-2 lg:col-12">
                        <label htmlFor="kode">Kode</label>
                        <div className="p-inputgroup">
                            <InputText autoFocus id="kode" value={fasilitasKamar.Kode} onChange={(e) => onInputChange(e, 'Kode')} readOnly={isUpdateMode} />
                        </div>
                    </div>
                    <div className="field col-12 mb-2 lg:col-12">
                        <label htmlFor="keterangan">Keterangan</label>
                        <InputText id="keterangan" value={fasilitasKamar.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} required />
                    </div>
                    <div className="field col-12 mb-2 lg:col-12">
                        <label htmlFor="deskripsi">Deskripsi</label>
                        <InputTextarea id="deskripsi" value={fasilitasKamar.Deskripsi} onChange={(e) => onInputChange(e, 'Deskripsi')} />
                    </div>
                    <div className="field col-12 mb-2 lg:col-12">
                        <label htmlFor="foto">Foto</label>
                        {/* Jika belum ada foto yang dipilih, tampilkan FileUpload */}
                        {!fasilitasKamar.foto && <FileUpload name="foto" accept="image/*" customUpload mode="basic" chooseLabel="Pilih Foto" auto={false} onSelect={onFileSelect} />}
                        {/* Jika sudah ada foto yang dipilih, tampilkan preview foto */}
                        {fasilitasKamar.foto && (
                            <div className="mt-2">
                                <img src={fasilitasKamar.foto} alt="Preview Foto" style={{ maxWidth: '50%', height: 'auto', marginBottom: '10px' }} />
                                <div className="mt-2">
                                    <Button
                                        label="Hapus Foto"
                                        icon="pi pi-trash"
                                        className="p-button-danger"
                                        style={{ display: 'inline-block', marginTop: '10px' }}
                                        onClick={clearFile} // Menghapus foto ketika tombol ini diklik
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
