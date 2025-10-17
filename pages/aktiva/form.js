import { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../utilities/servertool';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useRouter } from 'next/router';
import { RadioButton } from 'primereact/radiobutton';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'jspdf-autotable';
import postData from '../../lib/Axios';
import { convertToISODate } from '../../component/GeneralFunction/GeneralFunction';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/aktiva');
    if (sessionData?.redirect) {
        return sessionData;
    }

    const { query } = context;
    return {
        props: {
            query
        }
    };
};

export default function FormAktiva(props) {
    const [GolAktivaDialog, setGolAktivaDialog] = useState(false);
    const [keteranganGolAktiva, setketeranganGolAktiva] = useState('');
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field: 'Kode', header: 'Kode' },
        { field: 'Keterangan', header: 'Keterangan' }
    ];
    const toast = useRef(null);
    const [aktiva, setAktiva] = useState({
        TglPerolehan: new Date(),
        TglPenyusutan: new Date(),
        JenisPenyusutan: '0',
        TarifPenyusutan: 0,
        Lama: 1
    });
    const [aktivaTabel, setAktivaTabel] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    //hubungan dengan path api disini
    //create
    const apiEndPointUpdate = '/api/aktiva/update/';

    const apiEndPointStore = '/api/aktiva/store';
    const apiEndPointGetGolAktiva = '/api/golonganaktiva/get';
    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    //filter helper rekening
    const [globalFilter, setGlobalFilter] = useState('');
    const onFilterInput = (event) => {
        setGlobalFilter(event.target.value);
    };

    const filterOptions = {
        global: { value: globalFilter, matchMode: 'contains' }
    };
    const saveAktiva = async (e) => {
        try {
            e.preventDefault();
            // if (!validateFields()) {
            // toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harap lengkapi form data Nasabah', life: 3000 });
            // return;
            // }

            //proses create / update data

            const formattedAktiva = {
                ...aktiva,
                TglPerolehan: convertToISODate(aktiva.TglPerolehan),
                TglPenyusutan: convertToISODate(aktiva.TglPenyusutan)
            };

            let ep = '';
            if (isUpdateMode) {
                ep = apiEndPointUpdate;
            } else {
                ep = apiEndPointStore;
            }

            const vaProcess = await postData(ep, formattedAktiva);
            let data = vaProcess.data;
            showSuccess(data.message);
            router.push('/aktiva');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e.message);
        }
    };

    // Fungsi untuk menangani perubahan pada komponen tanggal
    const onInputDateChange = (e, name) => {
        // Mengambil nilai dari e.target.value atau e.value jika ada
        const val = (e.target && e.target.value) || e.value || '';
        const updatedAktiva = { ...aktiva };

        // Mengkonversi nilai menjadi objek Date dan memformat tanggal
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
            // Memastikan tanggal valid
            const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            updatedAktiva[name] = formattedDate;
        } else {
            updatedAktiva[name] = '';
        }

        setAktiva(updatedAktiva);
    };

    // Fungsi untuk menangani perubahan pada input teks/umum
    const onInputChange = (e, name) => {
        // Mengambil nilai dari e.target.value atau e.value
        const val = (e.target && e.target.value) || e.value;
        const updatedAktiva = { ...aktiva };
        updatedAktiva[name] = val;
        setAktiva(updatedAktiva);
        console.log(val);

        // Mengatur ulang error (jika diperlukan)
        setNamaError('');
        setAlamatError('');
        setKTPError('');
    };

    // Fungsi untuk menangani perubahan pada komponen InputNumber
    const onInputNumberChange = (e, name) => {
        // Pada InputNumber, nilai biasanya terdapat pada properti e.value
        const val = e.value;
        const updatedAktiva = { ...aktiva };
        updatedAktiva[name] = val;
        setAktiva(updatedAktiva);
        console.log(val);
    };

    //--------------------------------------------------------------------------< Combobox GolAktiva >
    const onJenisPenyusutanChange = (e) => {
        let _aktiva = { ...aktiva };
        _aktiva['JenisPenyusutan'] = e.value;
        setAktiva(_aktiva);
    };
    const onSaldoMenurunChange = (e) => {
        let _aktiva = { ...aktiva };
        _aktiva['JenisPenyusutan'] = e.value;
        setAktiva(_aktiva);
    };
    const onRowGolAktivaSelect = (event) => {
        const dataOnRow = event.data;
        setketeranganGolAktiva(dataOnRow.Keterangan);
        let _aktiva = { ...aktiva };
        _aktiva['Golongan'] = event.data.Kode;
        setAktiva(_aktiva);
        setGolAktivaDialog(false);
    };

    const [golAktivaTable, setGolAktivaTable] = useState(null);
    const toggleGolAktiva = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setGolAktivaDialog(true);
        setLoadingItem(true);
        // const res = await dataTableGolAktiva(indeks);
        try {
            let requestBody = { ...lazyState };
            let vaTable = await postData(apiEndPointGetGolAktiva, requestBody);
            const data = vaTable.data.data;
            setGolAktivaTable(data);
            console.log(data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e.message);
        }

        setLoadingItem(false);
    };

    const apiEndPointGetEdit = '/api/aktiva/getdata_edit';

    useEffect(() => {
        const { status } = router.query;
        const KODE = localStorage.getItem('KODE_AKTIVA');
        if (status === 'update') {
            getDataEdit(KODE);
            setIsUpdateMode(true);
        } else {
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, []);

    const getDataEdit = async (Kode) => {
        setLoading(true);

        try {
            // let res = await postData(apiDirPath, { Kode: id }, { headers: header });
            let res = await postData(apiEndPointGetEdit, { Kode });
            let data = res.data.data || [];
            setAktiva(data);
            setketeranganGolAktiva(data.GolKeterangan);
            console.log(data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e.message);
        }

        setLoading(false);
    };

    const countNilaiPersen = () => {
        const hargaPerolehan = aktiva?.HargaPerolehan || 0;
        const residu = aktiva?.Residu || 0;
        const lama = aktiva?.Lama > 0 ? aktiva.Lama : 1; // Pastikan tidak 0 atau null

        // Cek apakah hargaPerolehan lebih dari 0 agar tidak terjadi pembagian dengan 0
        if (hargaPerolehan <= 0) {
            showError('Harga perolehan tidak boleh 0 atau negatif');
            setAktiva((p) => ({ ...p, TarifPenyusutan: 0 }));
            return;
        }

        let HargaPerTahun = (hargaPerolehan - residu) / lama;

        // Pastikan harga per tahun tidak negatif
        if (HargaPerTahun < 0) HargaPerTahun = 0;

        const perTahun = (HargaPerTahun / hargaPerolehan) * 100;

        setAktiva((p) => ({ ...p, TarifPenyusutan: isFinite(perTahun) ? perTahun : 0 }));
    };

    useEffect(() => {
        if (aktiva?.HargaPerolehan > 0) {
            countNilaiPersen();
        }
    }, [aktiva?.HargaPerolehan, aktiva?.Residu, aktiva?.Lama]);

    //--------------------------------------------[HEADER HELPER]-
    const headerHelperPopUp = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={onFilterInput} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    //------------------------------------------ END OF DROPDOWN COMPONENT ------------------------------------------
    // ------------------------------------------------------------------------------------------------------ button
    const router = useRouter();
    const aktivaFooter = (
        <div>
            <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                    router.push('/aktiva');
                }}
            />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveAktiva} />
        </div>
    );

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    //----------------------------------------------------------------------------- VALIDATOR -----------------------------------------------------------------------------

    // AutoFocus ke komponen yang tidak valid
    const UseFocus = () => {
        const htmlElRef = useRef(null);
        const setFocus = () => {
            htmlElRef.current && htmlElRef.current.focus();
        };
        return [htmlElRef, setFocus];
    };

    const [namaError, setNamaError] = useState('');
    const [alamatError, setAlamatError] = useState('');
    const [ktpError, setKTPError] = useState('');
    return (
        <div className="card">
            <h4>Add Master Aktiva</h4>
            <hr />
            <Toast ref={toast} />

            <div className="formgrid grid">
                {/* Field Kode */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="kode">Kode</label>
                    <div className="p-inputgroup">
                        <InputText
                            id="kode"
                            value={aktiva?.Kode}
                            readOnly={isUpdateMode}
                            placeholder="contoh : 0001"
                            onChange={(e) => onInputChange(e, 'Kode')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.Kode })}
                        />
                    </div>
                </div>

                {/* Field Nama */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="nama">Nama</label>
                    <div className="p-inputgroup">
                        <InputText
                            id="nama"
                            value={aktiva?.Nama}
                            onChange={(e) => onInputChange(e, 'Nama')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.Nama })}
                        />
                    </div>
                </div>

                {/* Field Tgl Perolehan */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="TglPerolehan">Tgl Perolehan</label>
                    <div className="p-inputgroup">
                        <Calendar readOnlyInput value={aktiva?.TglPerolehan ? new Date(aktiva?.TglPerolehan) : null} id="TglPerolehan" onChange={(e) => onInputDateChange(e, 'TglPerolehan')} showIcon dateFormat="dd-mm-yy" />
                    </div>
                </div>

                {/* Field Tgl Penyusutan */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="TglPenyusutan">Tgl Mulai Penyusutan</label>
                    <div className="p-inputgroup">
                        <Calendar
                            readOnlyInput
                            value={aktiva?.TglPenyusutan ? new Date(aktiva?.TglPenyusutan) : null}
                            id="TglPenyusutan"
                            onChange={(e) => onInputDateChange(e, 'TglPenyusutan')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.TglPenyusutan })}
                            showIcon
                            dateFormat="dd-mm-yy"
                        />
                    </div>
                </div>

                {/* Field Jumlah Unit */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="jumlahUnit">Jumlah Unit</label>
                    <div className="p-inputgroup">
                        <InputNumber
                            inputStyle={{ textAlign: 'right' }}
                            id="jumlahUnit"
                            value={aktiva?.Unit}
                            onChange={(e) => onInputChange(e, 'Unit')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.Unit })}
                        />
                    </div>
                </div>

                {/* Field Golongan Aktiva */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="golongan">Golongan Aktiva</label>
                    <div className="p-inputgroup">
                        <InputText
                            style={{ width: '20%', borderRadius: '5px' }}
                            readOnly
                            id="golongan"
                            value={aktiva?.Golongan}
                            onChange={(e) => onInputChange(e, 'Golongan')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.Golongan })}
                        />
                        <Button icon="pi pi-search" className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} onClick={toggleGolAktiva} />
                        <InputText style={{ width: '60%', borderRadius: '5px' }} readOnly id="ket-polAktiva" value={keteranganGolAktiva} />
                    </div>
                    {submitted && !aktiva?.Golongan && <small className="p-invalid">Golongan Aktiva is required.</small>}
                </div>

                {/* Radio Button Jenis Penyusutan */}
                <div className="field-radiobutton col-6">
                    <RadioButton inputId="jenisPenyusutanGarisLurus" name="JenisPenyusutan" value="1" onChange={onJenisPenyusutanChange} checked={aktiva?.JenisPenyusutan === '1'} />
                    <label htmlFor="jenisPenyusutanGarisLurus">Garis Lurus</label>
                    <RadioButton style={{ marginLeft: '10px' }} inputId="jenisPenyusutanSaldoMenurun" name="JenisPenyusutan" value="0" onChange={onSaldoMenurunChange} checked={aktiva?.JenisPenyusutan === '0'} />
                    <label htmlFor="jenisPenyusutanSaldoMenurun">Saldo Menurun</label>
                </div>

                {/* Field Lama Penyusutan */}
                <div className="field col-12 mb-2 lg:col-3">
                    <label htmlFor="Lama">Lama Penyusutan</label>
                    <div className="p-inputgroup">
                        <InputNumber
                            id="Lama"
                            value={aktiva?.Lama}
                            onChange={(e) => onInputChange(e, 'Lama')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.Lama })}
                        />
                        <Button label="Bulan" className="p-button" style={{ pointerEvents: 'none' }} />
                    </div>
                </div>

                {/* Field Tarif Penyusutan */}
                <div className="field col-12 mb-2 lg:col-3">
                    <label htmlFor="TarifPenyusutan">Tarif Penyusutan</label>
                    <div className="p-inputgroup">
                        <InputNumber id="TarifPenyusutan" value={aktiva?.TarifPenyusutan} onChange={(e) => onInputChange(e, 'TarifPenyusutan')} max={100} />
                        <Button label="% per Tahun" className="p-button" style={{ pointerEvents: 'none' }} />
                    </div>
                </div>
            </div>

            <div className="formgrid grid">
                {/* Field Harga Perolehan */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="HargaPerolehan">Harga Perolehan</label>
                    <div className="p-inputgroup">
                        <InputNumber
                            inputStyle={{ textAlign: 'right' }}
                            id="HargaPerolehan"
                            value={aktiva?.HargaPerolehan}
                            onChange={(e) => onInputChange(e, 'HargaPerolehan')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.HargaPerolehan })}
                        />
                    </div>
                </div>

                {/* Field Nilai Residu */}
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="Residu">Nilai Residu</label>
                    <div className="p-inputgroup">
                        <InputNumber
                            inputStyle={{ textAlign: 'right' }}
                            id="Residu"
                            value={aktiva?.Residu}
                            onChange={(e) => onInputChange(e, 'Residu')}
                            // className={classNames({ 'p-invalid': submitted && !aktiva?.Residu })}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => router.push('/aktiva')} />
                    <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveAktiva} loading={loadingItem} />
                </div>
            </div>

            {/* Dialog untuk memilih Golongan Aktiva */}
            <Dialog visible={GolAktivaDialog} header="Golongan Aktiva" modal className="p-fluid" onHide={() => setGolAktivaDialog(false)} style={{ width: '700px' }}>
                <DataTable
                    size="small"
                    value={golAktivaTable}
                    onRowSelect={onRowGolAktivaSelect}
                    selectionMode="single"
                    dataKey="ID"
                    paginator
                    rows={10}
                    header={headerHelperPopUp}
                    globalFilter={globalFilter}
                    filter
                    filterOptions={filterOptions}
                    filterMode="match"
                    emptyMessage="Data Kosong"
                >
                    <Column field="Kode" header="Kode" />
                    <Column field="Keterangan" header="Keterangan" />
                </DataTable>
            </Dialog>
        </div>
    );
}
