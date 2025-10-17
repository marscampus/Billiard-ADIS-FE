/**
 * Nama Program: GODONG POS - Sesi Jual
 * Pengembang: Salsabila Emma
 * Tanggal Pengembangan: 1 Jan 2024
 * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Sesi Jual Kasir
    - Create, Read, Rekap, Closing
    - STATUS Sesi Jual 0-Aktif, 1-Simpan, 2-Close
 */
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { formatDate, formatRibuan, getYMD, showError, showSuccess } from '../../component/GeneralFunction/GeneralFunction';
import styles from '../../component/styles/dataTable.module.css';
// import Rekap from './rekap';
import { useRouter } from 'next/router';
import TabelSkaleton from '../../component/tabel/skaleton';
import Rekap from './rekapSupervisor';

import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import Supervisor from '../component/supervisor';
import UserKasir from '../component/userKasir';
import { useSession } from 'next-auth/react';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/kasir');
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};
function sesiJual({ shiftDialog, hideDialog, onSesiSelect }) {
    // PATH API
    // API SELECT TOKO
    const apiEndPointGetShiftKasir = '/api/shift_kasir/get';
    const apiEndPointGetToko = '/api/gudang/get';
    const apiEndPointGetShift = '/api/shift_kasir/select_shift';
    const apiEndPointStore = '/api/shift_kasir/store';
    const apiEndPointGetTotalRekap = '/api/rekapkasir/hotel/get_total';
    const apiEndPointGetUangPecahan = '/api/rekapkasir/hotel/get_uangpecahan';
    const apiEndPointClosing = '/api/shift_kasir/closing';
    const apiEndPointSelectSesi = '/api/shift_kasir/select_sesi';

    const { data: session, status } = useSession();
    const toast = useRef(null);
    const [dataShift, setDataShift] = useState([]);
    const [dataShiftTabel, setDataShiftTabel] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    // CONST REKAP
    const [rekapDialog, setRekapDialog] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    let emptyshift = {
        SUPERVISOR: '',
        SUPERVISOR_NAMA: '',
        TANGGAL: '',
        TOKO: '',
        KASSA: '',
        KASIR: '',
        KASIR_NAMA: '',
        SHIFT: '',
        KASAWAL: ''
    };

    //  Yang Handle Toast

    const onPage = (event) => {
        setlazyState(event);
    };
    useEffect(() => {
        if (shiftDialog) {
            loadLazyData();
            setDataShift((prevDataShift) => ({
                ...prevDataShift,
                KASIR: session?.user?.email,
                KASIR_NAMA: session?.user?.email,
                TGL: new Date()
            }));
        }
    }, [session]);

    const [kasir, setKasir] = useState(false);
    const loadLazyData = async () => {
        // setShiftDialog(true);
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGetShiftKasir, lazyState);
            const jsonShift = vaTable.data;
            setDataShift((prevDataShift) => ({
                ...prevDataShift
            }));
            setTotalRecords(jsonShift.total);
            setDataShiftTabel(jsonShift.data);
            setLoading(true);
            setKasir([]);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _dataShift = { ...dataShift };
        _dataShift[name] = val;
        setDataShift(_dataShift);
    };
    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _dataShift = { ...dataShift };
        _dataShift[`${name}`] = val;
        setDataShift(_dataShift);
    };
    const dropdownValues = Array.from({ length: 50 }, (_, index) => ({
        name: `Kassa ${(index + 1).toString()}`,
        value: `Kassa ${(index + 1).toString()}`
    }));

    // ------------------------------------------------------------------------------------------------< SELECT TOKO >
    const [tokoDialog, setTokoDialog] = useState(false);
    const [tokoTabel, setTokoTabel] = useState(null);
    const [keteranganToko, setKeteranganToko] = useState([]);
    const toggleToko = async (event) => {
        setLoading(true);
        setTokoDialog(true);
        try {
            const vaTable = await postData(apiEndPointGetToko, lazyState);
            const jsonToko = vaTable.data;
            setTotalRecords(jsonToko.total);
            setTokoTabel(jsonToko.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    const onRowSelectToko = (event) => {
        const selectedKode = event.data.KODE;
        const selectedToko = tokoTabel.find((toko) => toko.KODE === selectedKode);

        if (selectedToko) {
            let _toko = { ...dataShift };
            _toko.TOKO = selectedToko.KODE;
            setDataShift(_toko);

            setKeteranganToko(selectedToko.KETERANGAN);
        }
        setTokoDialog(false);
    };
    // ------------------------------------------------------------------------------------------------< SELECT SHIFT >
    const [shiftTabel, setShiftTabel] = useState(null);
    const [shiftJamDialog, setShiftJamDialog] = useState(false);
    const [keteranganShift, setKeteranganShift] = useState('');

    const toggleShift = async (event) => {
        setLoading(true);
        setShiftJamDialog(true);
        try {
            const vaTable = await postData(apiEndPointGetShift, lazyState);
            const jsonShift = vaTable.data;
            setTotalRecords(jsonShift.total);
            setShiftTabel(jsonShift.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };
    const onRowSelectShift = (event) => {
        const selectedKode = event.data.KODE;
        const selectedShift = shiftTabel.find((shift) => shift.KODE === selectedKode);

        if (selectedShift) {
            let _shift = { ...dataShift };
            _shift.SHIFT = selectedShift.KODE;
            setDataShift(_shift);
            setKeteranganShift(selectedShift.KETERANGAN);
        }
        setShiftJamDialog(false);
    };

    // ------------------------------------------------------------------------------------------------< SAVE >
    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };
    const router = useRouter();
    const btnCancel = async (e) => {
        router.push(`/`);
    };

    const saveDataShift = async (e) => {
        e.preventDefault();
        const formattedDate = dataShift.TGL ? getYMD(dataShift.TGL) : getYMD(new Date());
        let _dataShift = { ...dataShift, TGL: formattedDate, TOKO: '' };
        let _dataShiftTabel = [...dataShiftTabel];
        if (Object.keys(dataShift).length === 0 || (Object.keys(dataShift).length === 1 && dataShift.hasOwnProperty('TGL'))) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Masih Kosong!', life: 3000 });
            return;
        }
        _dataShiftTabel.push(_dataShift);
        try {
            const responsePost = await postData(apiEndPointStore, _dataShift);
            let json = responsePost.data;
            loadLazyData();
            setDataShift(emptyshift);
            setKeteranganToko('');
            setKeteranganShift('');
            _dataShiftTabel.push(_dataShift);
            showSuccess(toast, json.data?.message || 'Berhasil Create Data');
        } catch (error) {
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // ------------------------------------------------------------------------------------------------< CLOSING >
    const [closingDialog, setClosingDialog] = useState(false);
    const [rowData, setRowData] = useState(null);

    const openClosingDialog = (rowData) => {
        setRowData(rowData);
        setClosingDialog(true);
    };

    const closeClosingDialog = () => {
        setClosingDialog(false);
        setRowData(null);
    };

    const handleClosing = async () => {
        try {
            const requestBody = {
                KODESESI: rowData.SESIJUAL
            };
            const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointClosing };
            // const response = await axios.post(apiDirPath, requestBody, { headers: header });
            const response = await postData(apiEndPointClosing, requestBody);
            const json = response.data;

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Sesi Berhasil Ditutup', life: 3000 });
            // Update STATUS in the table data
            const updatedData = dataShiftTabel.map((item) => {
                if (item.SESIJUAL === rowData.SESIJUAL) {
                    return { ...item, STATUS: 2 };
                }
                return item;
            });
            setDataShiftTabel(updatedData);
            // if (json.status === 'exist') {
            //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'SESI Sudah Ditutup', life: 3000 });
            // } else if (json.status === 'success') {
            //     // } else if (json.status === "success") {
            //     //     toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Sesi Berhasil Ditutup', life: 3000 });
            // } else {
            //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kesalahan Proses', life: 3000 });
            // }
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            closeClosingDialog();
        }
    };

    const closingDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={closeClosingDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={handleClosing} />
        </>
    );

    // ------------------------------------------------------------------------------------------------< REKAP >
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [selectedRowDataRekap, setSelectedRowDataRekap] = useState(null);
    const rekap = async (rowData) => {
        setRekapDialog(true);
        setSelectedRowDataRekap(rowData);
        // return;
        let requestBody = {
            SESIJUAL: rowData.SESIJUAL
        };

        try {
            const vaTable = await postData(apiEndPointGetTotalRekap, requestBody);
            const json = vaTable.data;
            setSelectedRowData(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
        funcJurnalUangPecahan(rowData);
    };

    // -------------------------------------------------------------------------------------------------< GET uangpecahan di Dialog Rekap >
    const [jurnalUangPecahan, setJurnalUangPecahan] = useState([]);
    const funcJurnalUangPecahan = async (rowData) => {
        let requestBody = {
            SESIJUAL: rowData.SESIJUAL
        };
        try {
            const vaTable = await postData(apiEndPointGetUangPecahan, requestBody);
            const json = vaTable.data;
            setJurnalUangPecahan(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    // ------------------------------------------------------------------------------------------------< SELECT SESI >
    const onRowSelectSesi = async (event) => {
        setLoading(true);
        const selectedSesiJual = event.data.SESIJUAL;
        let today = new Date();
        const selectedSesi = dataShiftTabel.find((sesi) => sesi.SESIJUAL === selectedSesiJual);
        if (selectedSesi) {
            try {
                const reqBody = {
                    SesiJual: selectedSesi.SESIJUAL,
                    Kassa: selectedSesi.KASSA,
                    Tgl: selectedSesi.TGL,
                    Kasir: selectedSesi.USERNAMEKASIR
                };
                const responsePost = await postData(apiEndPointSelectSesi, reqBody);
                let json = responsePost.data;
                // if (json.code === '200') {
                toast.current.show({ severity: 'success', summary: json.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
                onSesiSelect(selectedSesi);
                localStorage.setItem('selectedSesi', JSON.stringify(selectedSesi));
                hideDialog();
                // } else if (json.status == 'USER INVALID') {
                //     toast.current.show({ severity: 'error', summary: json.message, detail: 'Sesi yang Anda pilih tidak sesuai dengan Sesi Login', life: 3000 });
                // } else {
                //     toast.current.show({ severity: 'error', summary: json.message, detail: 'Sesi Sudah Ditutup', life: 3000 });
                // }
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        }
        setLoading(false);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div style={{ display: 'flex' }}>
                <Button style={{ backgroundColor: '#87CEEB', margin: '1px' }} icon="pi pi-save" severity="success" rounded onClick={() => rekap(rowData)} />
                <Button style={{ backgroundColor: '#ffb6c1', margin: '1px' }} icon="pi pi-book" severity="danger" rounded onClick={() => openClosingDialog(rowData)} />
            </div>
        );
    };

    const colorMap = {
        0: { color: '#75c1a1', tooltip: 'Aktif' }, // Warna pastel hijau gelap
        1: { color: '#94a6b2', tooltip: 'Simpan' }, // Warna pastel biru gelap
        2: { color: '#e5a290', tooltip: 'Close' } // Warna pastel merah gelap
    };
    const getStatusBadge = (rowData) => {
        const { STATUS } = rowData;
        const { color, tooltip } = colorMap[STATUS] || { color: '#dcdcdc', tooltip: 'Unknown Status' };

        return (
            <span className="p-badge" style={{ backgroundColor: color }} title={tooltip}>
                {STATUS}
            </span>
        );
    };
    // -----------------------------------------------------------------------------------------------------------------< Supervisor >
    const [supervisorDialog, setSupervisorDialog] = useState(false);
    const [supervisorKode, setSupervisorKode] = useState('');
    const [supervisorKet, setSupervisorKet] = useState('');
    const btnSupervisor = () => {
        setSupervisorDialog(true);
    };
    const handleSupervisorData = (supervisorKode, supervisorKet) => {
        setSupervisorKode(supervisorKode); //
        setSupervisorKet(supervisorKet);
        setDataShift((prevDataShift) => ({
            ...prevDataShift,
            SUPERVISOR: supervisorKode,
            SUPERVISOR_NAMA: supervisorKet
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< UserKasir >
    const [userKasirDialog, setUserKasirDialog] = useState(false);
    const [userKasirKode, setUserKasirKode] = useState('');
    const [userKasirKet, setUserKasirKet] = useState('');
    const btnUserKasir = () => {
        setUserKasirDialog(true);
    };
    const handleUserKasirData = (userKasirKode, userKasirKet) => {
        setUserKasirKode(userKasirKode);
        setUserKasirKet(userKasirKet);
        setDataShift((prevDataShift) => ({
            ...prevDataShift,
            KASIR: userKasirKode,
            KASIR_NAMA: userKasirKet
        }));
    };
    const headerNote = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <label style={{ color: 'red' }}>* Klik dua kali untuk masuk ke sesi penjualan</label>
        </div>
    );
    return (
        <div>
            <Toast ref={toast} />
            <Dialog visible={shiftDialog} style={{ width: '90%' }} header="Sesi Penjualan" modal className="p-fluid" closable={false}>
                <div className="formgrid grid">
                    <div className="field col-12 mb-2 lg:col-4">
                        <div className="formgrid grid">
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="supervisor">Supervisor</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="kasir" value={dataShift.SUPERVISOR} onChange={(e) => onInputChange(e, 'SUPERVISOR')} required />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnSupervisor} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="tglPerubahan">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar
                                        value={dataShift.TGL} // Set the value to the state property
                                        onChange={(e) => onInputChange(e, 'TGL')}
                                        showIcon
                                        dateFormat="dd-mm-yy"
                                    />
                                </div>
                            </div>
                            {/* <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="toko">Toko</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="toko" value={dataShift.TOKO} onChange={(e) => onInputChange(e, 'TOKO')} required />
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleToko} />
                                    <InputText readOnly value={keteranganToko} />
                                </div>
                            </div> */}
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="kassa">Kassa</label>
                                <div className="p-inputgroup">
                                    <Dropdown value={dataShift.KASSA} onChange={(e) => onInputChange(e, 'KASSA')} options={dropdownValues} optionLabel="name" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="kasir">Kasir</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="kasir" value={dataShift.KASIR_NAMA} onChange={(e) => onInputChange(e, 'KASIR')} required />
                                    {/* <InputText readOnly id="kasir" value={dataShift.KASIR_NAMA} onChange={(e) => onInputChange(e, 'KASIR')} required />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnUserKasir} /> */}
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="shift">Shift</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="toko" value={dataShift.SHIFT} onChange={(e) => onInputChange(e, 'SHIFT')} required />
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleShift} />
                                    <InputText readOnly id="" value={keteranganShift} />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="kasawal">Kas Awal</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={dataShift.KASAWAL} onChange={(e) => onInputNumberChange(e, 'KASAWAL')} required inputStyle={{ textAlign: 'right' }} />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 my-2 lg:col-4"></div>
                            <div className="field col-4 mb-2 my-2 lg:col-4">
                                <Button label="Cancel" className="p-button-secondary p-button-sm mr-2" style={{ alignItems: 'right' }} onClick={btnCancel} />
                            </div>
                            <div className="field col-4 mb-2 my-2 lg:col-4">
                                <Button label="Save" className="p-button-primary p-button-sm mr-2" style={{ alignItems: 'right' }} onClick={saveDataShift} />
                            </div>
                        </div>
                    </div>
                    <Divider style={{ margin: '-1px' }} layout="vertical">
                        {' '}
                    </Divider>
                    <div className="field col-12 mb-2 lg:col-8">
                        <div className={styles.datatableContainer}>
                            <DataTable
                                size="small"
                                responsiveLayout="scroll"
                                scrollable
                                scrollHeight="250px"
                                selectionMode="single"
                                value={dataShiftTabel}
                                lazy
                                dataKey="KODESESI"
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowDoubleClick={onRowSelectSesi}
                                header={headerNote}
                            >
                                {/* <Column headerStyle={{ textAlign: "center" }} field="STATUS" header="STATUS" body={(rowData) => getStatusBadge(rowData.STATUS)}></Column> */}
                                <Column headerStyle={{ textAlign: 'center' }} field="SESIJUAL" header="SESI JUAL"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="STATUS" header="STATUS" body={getStatusBadge}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL" body={(rowData) => formatDate(rowData.TGL)}></Column>
                                {/* <Column headerStyle={{ textAlign: 'center' }} field="SUPERVISOR" header="SUPERVISOR"></Column> */}
                                <Column headerStyle={{ textAlign: 'center' }} field="KASIR" header="KASIR"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="TOKO" header="TOKO"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KASSA" header="KASSA"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="SHIFT" header="SHIFT"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KASAWAL" header="KAS AWAL" body={(rowData) => formatRibuan(rowData.KASAWAL)} bodyStyle={{ textAlign: 'right' }}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                            </DataTable>
                        </div>
                    </div>
                </div>
            </Dialog>
            <UserKasir userKasirDialog={userKasirDialog} setUserKasirDialog={setUserKasirDialog} btnUserKasir={btnUserKasir} handleUserKasirData={handleUserKasirData} />
            <Supervisor supervisorDialog={supervisorDialog} setSupervisorDialog={setSupervisorDialog} btnSupervisor={btnSupervisor} handleSupervisorData={handleSupervisorData} />
            {/* -----------------------------------------------------------------------------------------< DIALOG GUDANG > */}
            <Dialog visible={tokoDialog} style={{ width: '700px' }} header="Toko" modal className="p-fluid" onHide={() => setTokoDialog(false)}>
                {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columnsToko} />}
                {!loadingItem && (
                    <DataTable
                        size="small"
                        value={tokoTabel}
                        lazy
                        dataKey="KODE"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        onRowSelect={onRowSelectToko}
                        selectionMode="single"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                    </DataTable>
                )}
            </Dialog>
            {/* -----------------------------------------------------------------------------------------< DIALOG SHIFT > */}
            <Dialog visible={shiftJamDialog} style={{ width: '700px' }} header="Shift" modal className="p-fluid" onHide={() => setShiftJamDialog(false)}>
                {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columnsShift} />}
                {!loadingItem && (
                    <DataTable
                        size="small"
                        value={shiftTabel}
                        lazy
                        dataKey="SHIFT"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        onRowSelect={onRowSelectShift}
                        selectionMode="single"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="SHIFT"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                    </DataTable>
                )}
            </Dialog>
            {/* -----------------------------------------------------------------------------------------< DIALOG VALIDASI CLOSING > */}
            <Dialog visible={closingDialog} header="Confirm" modal footer={closingDialogFooter} onHide={() => setClosingDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Yakin ingin Menutup Sesi ?</span>
                </div>
            </Dialog>
            <Rekap
                rekapDialog={rekapDialog}
                setRekapDialog={setRekapDialog}
                dataShift={dataShift}
                setDataShift={setDataShift}
                selectedRowData={selectedRowData}
                setSelectedRowData={setSelectedRowData}
                selectedRowDataRekap={selectedRowDataRekap}
                setSelectedRowDataRekap={setSelectedRowDataRekap}
                jurnalUangPecahan={jurnalUangPecahan}
            />
        </div>
    );
}

export default sesiJual;
