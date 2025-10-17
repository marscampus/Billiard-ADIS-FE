/* eslint-disable */
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/router';
import { getSessionServerSide } from '../../utilities/servertool';
import { convertToISODate, getKeterangan, getRekeningKas, getTglTransaksi } from '../../component/GeneralFunction/GeneralFunction';
import RekeningCOA from '../component/RekeningCOA';
import postData from '../../lib/Axios';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/transaksikas');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function PenerimaanKas() {
    const [urutTabel, setUrutTabel] = useState(0);
    const [totalNominal, setTotalNominal] = useState(0);
    const [tempTotal, setTempTotal] = useState(0);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    //hubungan dengan path api disini
    // get faktur
    const apiEndPoinGetFaktur = '/api/get_faktur';
    //create
    const apiEndPointStore = '/api/kas/store';
    //update
    const apiEndPointUpdate = '/api/kas/update';
    // get data penerimaan kas
    const apiEndPoinGetDataPenerimaanKas = '/api/kas/get-data/penerimaan';

    let emptypenerimaankas = {
        ID: null,
        Faktur: null,
        Tgl: null,
        Rekening: null,
        KeteranganRekening: null,
        Jumlah: null,
        Keterangan: null
    };

    const toast = useRef(null);
    const router = useRouter();

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const [tglTransaksi, setTglTransaksi] = useState(new Date());
    const [faktur, setFaktur] = useState('');
    const [penerimaanKas, setPenerimaanKas] = useState([emptypenerimaankas]);
    const [penerimaanKasDetail, setPenerimaanKasDetail] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [indexActionKredit, setIndexActionKredit] = useState(null);
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [dialogType, setDialogType] = useState(null);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [inputData, setInputData] = useState({
        No: null,
        Rekening: null,
        KeteranganRekening: null,
        Keterangan: null,
        Jumlah: null
    });

    useEffect(() => {
        const { status } = router.query;
        const Faktur = localStorage.getItem('Faktur');
        if (status === 'update') {
            setFaktur(Faktur);
            getDataEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false);
        }
        // getRekKas();
        loadTglTransaksi();
    }, [lazyState]);

    const onPage = () => {};

    const initRoute = () => {
        router.push('/transaksikas/');
    };

    const nominalBodyTemplate = (rowData) => {
        let formattedValue = 0;
        if (rowData.Jumlah === 0) {
            formattedValue = '';
        } else {
            formattedValue = rowData.Jumlah.toLocaleString('id-ID', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        return formattedValue;
    };

    const onInputDebetChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _penerimaankas = { ...penerimaanKas };
        _penerimaankas[name] = val;
        _penerimaankas[`Faktur`] = faktur;
        setPenerimaanKas(_penerimaankas);
        setJumlahError('');
        setRekeningError('');
        setKeteranganError('');

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _inputData = { ...inputData };
        _inputData[name] = val;
        setInputData(_inputData);

        setJumlahError('');
        setRekeningError('');
        setKeteranganError('');

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _inputData = { ...inputData };
        _inputData[name] = val;
        setInputData(_inputData);

        setJumlahError('');
        setRekeningError('');
        setKeteranganError('');

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const createDataObject = (_penerimaanKas, _detail) => {
        return {
            Faktur: faktur,
            Tgl: convertToISODate(tglTransaksi),
            Rekening: _penerimaanKas.RekeningDebet,
            Keterangan: _penerimaanKas.Keterangan,
            Total: totalNominal,
            detail: _detail.map((item) => ({
                Rekening: item.Rekening,
                Keterangan: item.Keterangan,
                Jumlah: item.Jumlah
            }))
        };
    };

    const savePenerimaanKasKredit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let _penerimaanKas = { ...penerimaanKas };
        let _detail = [...penerimaanKasDetail];
        let _data = createDataObject(_penerimaanKas, _detail);

        if (!_data.Faktur) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            setLoading(false);
            return;
        }

        if (!_data.Tgl) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tanggal Masih Kosong!', life: 3000 });
            setLoading(false);
            return;
        }

        if (!_data.Rekening) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Rekening Kas Masih Kosong!', life: 3000 });
            setLoading(false);
            return;
        }

        if (_data.Total <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Mutasi Masih Kosong!', life: 3000 });
            setLoading(false);
            return;
        }

        if (_data.detail.some((d) => d.Rekening == _data.Rekening)) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Rekening Kas dan Rekening Tidak Boleh Sama!', life: 3000 });
            setLoading(false);
            return;
        }
        
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaData = await postData(endPoint, _data);
            const json = vaData.data;

            showSuccess(json.message || 'Berhasil Menyimpan Data');
            router.push('/transaksikas');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div id="tombolSimpanBatal">
                    <Button label="Simpan" icon="pi pi-check" className="p-button-info mr-2" loading={loading} onClick={savePenerimaanKasKredit} />
                    <Button label="Batal" icon="pi pi-times" className="p-button-info mr-2" onClick={initRoute} />
                </div>
            </React.Fragment>
        );
    };

    const onInputDateChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _penerimaankas = { ...penerimaanKas };

        const date = new Date(val);
        const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

        _penerimaankas[`${name}`] = formattedDate;
        setPenerimaanKas(_penerimaankas);

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const [rekeningError, setRekeningError] = useState('');
    const [keteranganError, setKeteranganError] = useState('');
    const [jumlahError, setJumlahError] = useState('');

    const [rekeningDebetError, setRekeningDebetError] = useState('');
    const [keteranganDebetError, setKeteranganDebetError] = useState('');
    const [jumlahDebetError, setJumlahDebetError] = useState('');

    const validateTabel = () => {
        const errors = {
            Rekening: !penerimaanKas.RekeningKredit ? 'Rekening harus diisi' : '',
            Keterangan: !inputData.Keterangan ? 'Keterangan Harus diisi.' : '',
            Jumlah: !inputData.Jumlah ? 'Total Harus diisi.' : ''
        };

        setRekeningError(errors.Rekening);
        setKeteranganError(errors.Keterangan);
        setJumlahError(errors.Jumlah);

        return Object.values(errors).every((error) => !error);
    };

    const getRekKas = async () => {
        try {
            const data = await getRekeningKas();
            const keterangan = await getKeterangan(data, 'keterangan', 'rekening');
            setPenerimaanKas((prev) => ({
                ...prev,
                RekeningDebet: data,
                KetRekeningDebet: keterangan
            }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    const loadLazyData = async () => {
        loadFaktur();
    };

    const getDataEdit = async () => {
        setLoading(true);
        const Faktur = localStorage.getItem('Faktur');
        try {
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(apiEndPoinGetDataPenerimaanKas, requestBody);
            const json = vaData.data;

            // Tambahkan nomor urut ke detail berdasarkan indeks array
            const updatedDetail = json.detail.map((item, index) => ({
                ...item,
                No: index + 1 // Menambahkan kolom No
            }));

            // Hitung total nominal dari kolom Jumlah di penerimaanKasDetail
            const totalNominal = updatedDetail.reduce((acc, curr) => acc + curr.Jumlah, 0);

            // Set state
            setPenerimaanKas(json);
            setTglTransaksi(new Date(json.Tgl));
            setPenerimaanKasDetail(updatedDetail);
            setTotalNominal(totalNominal); // Update total nominal
            setUrutTabel(updatedDetail.length); // Set urut tabel ke panjang data yang sudah ada
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const setNull = () => {
        // Reset hanya input di header, tanpa memengaruhi data tabel
        setInputData({
            Keterangan: '',
            Jumlah: ''
        });

        setPenerimaanKas((prevKas) => ({
            ...prevKas,
            RekeningKredit: '',
            KetRekeningKredit: ''
        }));
    };

    const addIsiTabel = async (e) => {
        e.preventDefault();

        if (!validateTabel()) {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Harap lengkapi form data ',
                life: 3000
            });
            return;
        }

        try {
            const newNo = penerimaanKasDetail.length + 1;

            const newData = {
                No: newNo,
                Rekening: penerimaanKas.RekeningKredit,
                KeteranganRekening: penerimaanKas.KetRekeningKredit,
                Keterangan: inputData.Keterangan,
                Jumlah: inputData.Jumlah
            };

            const updatedDetail = [...penerimaanKasDetail, newData];

            // Hitung total nominal baru
            const newTotalNominal = updatedDetail.reduce((acc, curr) => acc + curr.Jumlah, 0);

            setPenerimaanKasDetail(updatedDetail);
            setTotalNominal(newTotalNominal); // Update total nominal
            setUrutTabel(newNo);
            setNull();
        } catch (error) {
            console.error('Error saat menambahkan data ke tabel:', error);
        }
    };

    const loadFaktur = async () => {
        setLoading(true);
        try {
            let requestBody = {
                Key: 'KM',
                Len: '2'
            };
            const vaTable = await postData(apiEndPoinGetFaktur, requestBody);
            const json = vaTable.data;
            setFaktur(json);
            const val = json || '';
            let _penerimaankas = { ...penerimaanKas };
            _penerimaankas[`Faktur`] = val;
            setPenerimaanKas(_penerimaankas);
        } catch (error) {
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    const loadTglTransaksi = async () => {
        setTglTransaksi(new Date());
    };

    const header = (
        <div className="formgrid grid">
            <div className="field col-1 mb-1 lg:col-1">
                <label htmlFor="no">No.</label>
                <div className="p-inputgroup">
                    <InputText id="no" value={1 + urutTabel} Name="no" onChange={(e) => onInputChange(e, 'No')} required readOnly />
                </div>
            </div>
            <div className="field col-3 mb-3 lg:col-3">
                <label htmlFor="rekening">Rekening</label>
                <div className="p-inputgroup">
                    <InputText id="rekeningkredit" value={penerimaanKas.RekeningKredit} onChange={(e) => onInputChange(e, 'Rekening')} />
                    <Button icon="pi pi-search" className="p-button" style={{ 'margin-left': '3px', 'margin-right': '3px', borderRadius: '5px' }} onClick={() => btnRekening('kredit')} />
                    <InputText readonly id="ket-Satuan" value={penerimaanKas.KetRekeningKredit} />
                </div>
                <small className="p-invalid" style={{ color: 'red' }}>
                    {rekeningError}
                </small>
            </div>
            <div className="field col-4 mb-4 lg:col-4">
                <label htmlFor="keteranganrekening">Keterangan</label>
                <div className="p-inputgroup">
                    <InputText id="keteranganrekening" value={inputData.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} Name="keterangan" required />
                </div>
                <small className="p-invalid" style={{ color: 'red' }}>
                    {keteranganError}
                </small>
            </div>
            <div className="field col-3 mb-2 lg:col-2">
                <label htmlFor="total">Total</label>
                <div className="p-inputgroup">
                    <InputNumber inputStyle={{ textAlign: 'right' }} id="jumlah" Name="jumlah" value={inputData.Jumlah} onChange={(e) => onInputNumberChange(e, 'Jumlah')} required />
                </div>
                <small className="p-invalid" style={{ color: 'red' }}>
                    {jumlahError}
                </small>
            </div>
            <div className="field col-2 mb-2 lg:col-2">
                <label htmlFor="kode">&nbsp;</label>
                <div className="p-inputgroup">
                    <Button label="OK" severity="success" className="mr-2" onClick={addIsiTabel} />
                </div>
            </div>
        </div>
    );

    //  Yang Handle Rekening
    const btnRekening = (type) => {
        setRekeningDialog(true);
        setDialogType(type);
    };

    const handleRekeningData = (kodeRekening, keteranganRekening, jenisRekening, type) => {
        if (jenisRekening == 'D') {
            setPenerimaanKas((prevKas) => ({
                ...prevKas,
                ...(type === 'debet' ? { RekeningDebet: kodeRekening, KetRekeningDebet: keteranganRekening } : { RekeningKredit: kodeRekening, KetRekeningKredit: keteranganRekening })
            }));
        } else {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Rekening Induk Tidak Dapat Dipilih',
                life: 3000
            });
        }
    };

    // Yang Handle Hapus Row Data
    const deleteSelectedRow = (rowData) => {
        // Hapus baris yang dipilih dari penerimaanKasDetail
        const updatedKasDetail = penerimaanKasDetail.filter((row) => row !== rowData);

        // Kurangi nilai `Jumlah` dari total nominal
        const jumlahToRemove = parseInt(rowData['Jumlah']);
        setTotalNominal(totalNominal - jumlahToRemove);

        // Perbarui objek penerimaanKas
        const updatedPenerimaanKas = {
            ...penerimaanKas,
            Jumlah: totalNominal - jumlahToRemove
        };
        setPenerimaanKas(updatedPenerimaanKas);

        // Perbarui data penerimaanKasDetail
        setPenerimaanKasDetail(updatedKasDetail);
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Penerimaan Kas Baru</h4>
                    <hr />
                    <Toast ref={toast} />
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-3">
                            <label htmlFor="kode">Faktur</label>
                            <div className="p-inputgroup">
                                <InputText style={{ borderRadius: '6px' }} id="fakturTambah" Name="faktur" value={faktur} onChange={(e) => onInputDebetChange(e, 'Faktur')} />
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-3">
                            <label htmlFor="kode">Tanggal</label>
                            <div className="p-inputgroup">
                                <Calendar id="tgl" value={tglTransaksi} onChange={(e) => onInputDateChange(e, 'Tgl')} showIcon dateFormat="dd-mm-yy" disabled={readOnlyEdit} />
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-6">
                            <label htmlFor="kode">Rekening Kas</label>
                            <div className="p-inputgroup">
                                <InputText style={{ width: '30%', borderRadius: '5px' }} readOnly id="rekening" value={penerimaanKas.RekeningDebet} onChange={(e) => onInputDebetChange(e, 'Rekening')} />
                                <Button icon="pi pi-search" className="p-button" style={{ 'margin-left': '3px', 'margin-right': '3px', borderRadius: '5px' }} onClick={() => btnRekening('debet')} />
                                <InputText style={{ width: '60%', borderRadius: '5px' }} readonly id="ket-Satuan" value={penerimaanKas.KetRekeningDebet} />
                            </div>
                            <small className="p-invalid" style={{ color: 'red' }}>
                                {rekeningDebetError}
                            </small>
                        </div>
                        <div className="field col-12 mb-2 lg:col-8">
                            <label htmlFor="kode">Keterangan</label>
                            <div className="p-inputgroup">
                                <InputText id="keterangandebet" Name="Faktur" value={penerimaanKas.Keterangan} onChange={(e) => onInputDebetChange(e, 'Keterangan')} />
                            </div>
                            <small className="p-invalid" style={{ color: 'red' }}>
                                {keteranganDebetError}
                            </small>
                        </div>
                        <div className="field col-12 mb-2 lg:col-4">
                            <label htmlFor="kode">Total</label>
                            <div className="p-inputgroup">
                                <InputNumber inputStyle={{ textAlign: 'right' }} id="total" Name="total" value={totalNominal} readOnly />
                            </div>
                            <small className="p-invalid" style={{ color: 'red' }}>
                                {jumlahDebetError}
                            </small>
                        </div>
                    </div>
                    <hr />

                    <DataTable
                        size="small"
                        id="tabelKas"
                        value={penerimaanKasDetail}
                        lazy
                        dataKey="ID"
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        header={header}
                        filters={lazyState.filters}
                        emptyMessage="Data Kosong"
                    >
                        <Column field="No" header="NO"></Column>
                        <Column field="Rekening" header="REKENING"></Column>
                        <Column field="KeteranganRekening" header="KETERANGAN REKENING"></Column>
                        <Column field="Keterangan" header="KETERANGAN KREDIT"></Column>
                        <Column field="Jumlah" header="JUMLAH KREDIT" style={{ textAlign: 'right' }} body={nominalBodyTemplate}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>

                    <Toolbar className="mb-4" end={rightToolbarTemplate}></Toolbar>
                </div>
            </div>
            <RekeningCOA
                rekeningDialog={rekeningDialog}
                setRekeningDialog={setRekeningDialog}
                btnRekening={btnRekening}
                handleRekeningData={(rekeningKode, rekeningKeterangan, rekeningJenis) => handleRekeningData(rekeningKode, rekeningKeterangan, rekeningJenis, dialogType)}
            ></RekeningCOA>
        </div>
    );
}
