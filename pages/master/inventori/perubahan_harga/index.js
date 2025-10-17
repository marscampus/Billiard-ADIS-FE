import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { formatDateSave, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import Produk from '../../../component/produk';

import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterPerubahanHarga() {
    // PATH INSERT
    const apiEndPointStore = '/api/perubahan_harga_stock/store';
    const toast = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const [statusAction, setUpdateMode] = useState(null);
    const [perubahanHarga, setPerubahanHarga] = useState([]);
    const [hargaLama, setHargaLama] = useState(null);
    const [hargaBaru, setHargaBaru] = useState(null);
    const [perubahanHargaTabel, setPerubahanHargaTabel] = useState([]);
    const [tglPerubahan, setTglPerubahan] = useState(new Date());
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const op = useRef(null);

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        loadLazyData();
    }, []);

    const loadLazyData = async () => {};

    const onInputChange = (e, name) => {
        // const val = (e.target && e.target.value) || '';
        const val = e.value || 0;
        let _perubahanHarga = { ...perubahanHarga };
        _perubahanHarga[`${name}`] = val;
        setPerubahanHarga(_perubahanHarga);
    };

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const createDataObject = (selectedRowData) => {
        const _data = {
            KODE: selectedRowData.KODE,
            TANGGAL_PERUBAHAN: formatDateSave(selectedRowData.TANGGAL_PERUBAHAN),
            // DISCOUNTLAMA: selectedRowData.DISCOUNT,
            // PAJAKLAMA: selectedRowData.PAJAK,
            HBLAMA: selectedRowData.HB,
            HJLAMA: selectedRowData.HJ,
            DISCOUNT: selectedRowData.DISCOUNT_BARU,
            PAJAK: selectedRowData.PAJAK_BARU,
            HB: selectedRowData.HB_BARU,
            HJ: selectedRowData.HJ_BARU
        };
        return _data;
    };
    const savePerubahanHarga = async (e) => {
        e.preventDefault();
        let _perubahanHarga = { ...perubahanHarga };
        let _data = createDataObject(_perubahanHarga);
        console.log(_data);
        // return;
        if (!_data.KODE) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'KODE Harus Diisi !', life: 3000 });
            return;
        }
        if (!_data.HJ) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harga Jual Baru Belum Diisi !', life: 3000 });
            return;
        }

        try {
            const responsePost = await postData(apiEndPointStore, _perubahanHarga);
            let data = responsePost.data;
            console.log(data);
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Disimpan', life: 3000 });
            setPerubahanHarga('');
            refreshTabel();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const perubahanHargaFooter = (
        <>
            {/* <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hide} /> */}
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={savePerubahanHarga} />
        </>
    );

    // ------------------------------------------------------------------------------------------------------------------ Toggle
    const toggleDataTable = async (event) => {
        // op.current.toggle(event);
        let indeks = null;
        let skipRequest = false;
        switch (event.index) {
            case 1:
                indeks = 2;
                hargaLama !== null ? (skipRequest = true) : '';
                break;
            case 2:
                indeks = 3;
                hargaBaru !== null ? (skipRequest = true) : '';
                break;
            default:
                indeks = 1;
                perubahanHarga !== null ? (skipRequest = true) : '';
                break;
        }

        setActiveIndex(event.index ?? 0);
    };
    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProduk = (dataProduk) => {
        setDataProduk(dataProduk);
        console.log(dataProduk);
        setPerubahanHarga((prevPerubahanHarga) => ({
            ...prevPerubahanHarga,
            KODE: dataProduk.KODE,
            NAMA: dataProduk.NAMA,
            DISCOUNT: dataProduk.DISCOUNT,
            PAJAK: dataProduk.PAJAK,
            HB: dataProduk.HB,
            HJ: dataProduk.HJ
        }));
    };

    // -------------------------------------------------------------------------------------------------------------------- CheckBox
    const onDateChange = (e) => {
        const selectedDate = e.value; // Mendapatkan nilai tanggal yang dipilih
        setTglPerubahan(e.value);
        setPerubahanHarga((prevPerubahanHarga) => ({
            ...prevPerubahanHarga,
            TANGGAL_PERUBAHAN: selectedDate
        }));
    };
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Perubahan Harga</h4>
                    <hr />
                    <Toast ref={toast} />
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        <TabPanel header="Produk" style={{ width: '100%' }}>
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="tglPerubahan">Tanggal Perubahan</label>
                                                <div className="p-inputgroup">
                                                    <Calendar
                                                        id="tgl-perubahan"
                                                        // value={perubahanHarga.TANGGAL_PERUBAHAN}
                                                        value={tglPerubahan}
                                                        onChange={onDateChange}
                                                        showIcon
                                                        dateFormat="dd-mm-yy"
                                                    />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="kode">Kode</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="kode" readOnly value={perubahanHarga.KODE} onChange={(e) => onInputChange(e, 'KODE')} />
                                                    <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="nama">Nama</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly id="rekeningKet" value={perubahanHarga.NAMA} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Harga Lama" style={{ width: '100%' }}>
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="diskon">Diskon</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly id="discount" value={perubahanHarga.DISCOUNT} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="pajak">Pajak</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={perubahanHarga.PAJAK} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="harga-beli1">Harga Beli 1</label>
                                        <div className="p-inputgroup">
                                            <InputNumber readOnly id="hb" value={perubahanHarga.HB} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="harga-jual1">Harga Jual 1</label>
                                        <div className="p-inputgroup">
                                            <InputNumber readOnly id="hj" value={perubahanHarga.HJ} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Harga Baru" style={{ width: '100%' }}>
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="diskon">Diskon</label>
                                        <div className="p-inputgroup">
                                            <InputNumber id="diskon" value={perubahanHarga.DISCOUNT_BARU} onChange={(e) => onInputChange(e, 'DISCOUNT_BARU')} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="pajak">Pajak</label>
                                        <div className="p-inputgroup">
                                            <InputNumber id="pajak" value={perubahanHarga.PAJAK_BARU} onChange={(e) => onInputChange(e, 'PAJAK_BARU')} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="harga-beli1">Harga Beli 1</label>
                                        <div className="p-inputgroup">
                                            <InputNumber style={{ width: '100%' }} inputStyle={{ textAlign: 'right' }} value={perubahanHarga.HB_BARU} onChange={(e) => onInputChange(e, 'HB_BARU')} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="harga-beli1">Harga Jual 1</label>
                                        <div className="p-inputgroup">
                                            <InputNumber style={{ width: '100%' }} inputStyle={{ textAlign: 'right' }} value={perubahanHarga.HJ_BARU} onChange={(e) => onInputChange(e, 'HJ_BARU')} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                    <Toolbar className="mb-4" right={perubahanHargaFooter}></Toolbar>

                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProduk={handleProduk} />
                </div>
            </div>
        </div>
    );
}
