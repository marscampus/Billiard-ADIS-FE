/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu rek_booking perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau rek_sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Sat Jun 15 2024 - 02:06:31
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../../utilities/servertool';
import { TabPanel, TabView } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import postData from '../../../lib/Axios';
import { ProgressBar } from 'primereact/progressbar';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import MultipleRekeningCOA from '../../component/MultipleRekeningCOA';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function KonfigurasiCOA() {
    const apiEndPointGetPembukuan = '/api/config/pembukuan/get';
    const apiEndPointGetRekening = '/api/rekening/get';
    const apiEndPointStore = '/api/setup/coa/store';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeIndexRekening, setActiveIndexRekening] = useState(0);

    const [pembelianLoaded, setPembelianLoaded] = useState(false);
    const [piutangLoaded, setPiutangLoaded] = useState(false);
    const [tokoLoaded, setTokoLoaded] = useState(false);
    const [adjLoaded, setAdjLoaded] = useState(false);
    const [pembukuanLoaded, setPembukuanLoaded] = useState(false);

    const [configPembelian, setConfigPembelian] = useState([]);
    const [configPiutang, setConfigPiutang] = useState([]);
    const [configToko, setConfigToko] = useState([]);
    const [configAdj, setConfigAdj] = useState([]);
    const [configPembukuan, setConfigPembukuan] = useState({});

    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [rekeningTable, setRekeningTable] = useState([]);
    const [activeFormField, setActiveFormField] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const dropdownValues = [
        { name: 'kode', label: 'kode' },
        { name: 'keterangan', label: 'keterangan' }
    ];
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [lazyStateRekening, setlazyStateRekening] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                if (!pembukuanLoaded) {
                    await loadPembukuan();
                    setPembukuanLoaded(true);
                }
            } finally {
                setLoading(false);
            }
        };

        getDataRekening();

        loadInitialData();
    }, []);

    const onPage = (event) => {
        setlazyStateRekening(event);
    };

    //  Yang Handle Get Data Pembukua
    const loadPembukuan = async () => {
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetPembukuan, lazyState);
            const json = vaTable.data.data;
            console.log(json);
            setConfigPembukuan(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Pergantian Data
    const toggleDataTable = async (event) => {
        const selectedIndex = event.index ?? 0;
        setActiveIndex(selectedIndex);
        setLoadingItem(true);
        try {
            if (selectedIndex === 0 && !pembukuanLoaded) {
                await loadPembukuan();
                setPembukuanLoaded(true);
            }
        } finally {
            setLoadingItem(false);
        }
    };

    // Yang Handle Save Data
    const saveKonfigurasi = async (e) => {
        e.preventDefault();
        // return console.log(configPembukuan);

        const combinedConfig = {
            // Pembukuan
            rek_booking: configPembukuan.rek_booking.rekening || '',
            rek_diskon: configPembukuan.rek_diskon.rekening || '',
            rek_sewa: configPembukuan.rek_sewa.rekening || '',
            rek_ppn: configPembukuan.rek_ppn.rekening || '',
            rek_aset: configPembukuan.rek_aset.rekening || '',
            rek_kewajiban: configPembukuan.rek_kewajiban.rekening || '',
            rek_modal: configPembukuan.rek_modal.rekening || '',
            rek_pendapatan: configPembukuan.rek_pendapatan.rekening || '',
            rek_biaya: configPembukuan.rek_biaya.rekening || ''
        };

        if (typeof combinedConfig === 'undefined' || Object.keys(combinedConfig).length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Kosong', life: 3000 });
            return;
        }

        try {
            setLoading(true);
            const key = Object.keys(combinedConfig);
            const keterangan = Object.values(combinedConfig);

            const res = await postData('/api/config/store', { kode: key, keterangan: keterangan });

            toast.current.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Config Berhasil Diperbarui',
                life: 3000
            });
            loadPembukuan();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const konfigurasiFooter = (
        <>
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveKonfigurasi} />
        </>
    );

    //  Yang Handle Rekening
    const getDataRekening = async () => {
        try {
            setLoadingItem(true);

            const vaTable = await postData(apiEndPointGetRekening, lazyStateRekening);
            const json = vaTable.data.data;
            setRekeningTable(json);
            console.log(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setRekeningTable([]);
        } finally {
            setLoadingItem(false);
        }
    };

    const handleSearchButtonClick = (formField) => (event) => {
        setActiveFormField(formField);
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        console.log(selectedRow);

        if (selectedRow.jenis_rekening == 'I') {
            showError('Rekening Induk Tidak Boleh Dipilih');
            return;
        }

        //  Menentukan FormField yang Sesuai
        switch (formField) {
            // ----------------------------------Pembukuan
            case 'rek_booking':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_booking: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_sewa':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_sewa: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_diskon':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_diskon: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_ppn':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_ppn: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_aset':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_aset: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_modal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_modal: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_pendapatan':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_pendapatan: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_kewajiban':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_kewajiban: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_biaya':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_biaya: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_disc_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_disc_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_pendapatanPenjualanTunai_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_pendapatanPenjualanTunai_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_pendapatanPenjualanNonTunai_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_pendapatanPenjualanNonTunai_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_epayment_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_epayment_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_kas_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_kas_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_bank_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_bank_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_point_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_point_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_donasi_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_donasi_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_ppn_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_ppn_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;
            case 'rek_selisihPenjualan_toko':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    rek_selisihPenjualan_toko: {
                        rekening: selectedRow.kode,
                        keterangan: selectedRow.keterangan
                    }
                }));
                break;

            default:
                break;
        }
        setRekeningDialog(false);
    };

    const onInputChangePembukuan = (e, name) => {
        const val = (e.target ? e.target.value : e.value) || '';

        setConfigPembukuan((prevConfigPembukuan) => ({
            ...prevConfigPembukuan,
            [name]: {
                rekening: val,
                keterangan: ''
            }
        }));
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Konfigurasi COA</h4>
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    {loading && <ProgressBar maode="inderminate" style={{ height: '6px' }}></ProgressBar>}
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        {/* TRANSAKSI */}
                        <TabPanel header="Transaksi" style={{ width: '100%' }}>
                            {/* Booking/dp */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Booking</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_booking?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_booking')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_booking')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_booking?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* rek_sewa */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Sewa</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_sewa?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_sewa')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_sewa')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_sewa?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* rek_diskon */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Diskon</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_diskon?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_diskon')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_diskon')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_diskon?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>

                            {/* rek_ppn */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Ppn</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_ppn?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_ppn')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_ppn')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_ppn?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* toko */}
                        <TabPanel header="Toko" style={{ width: '100%' }}>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Penjualan Tunai</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanPenjualanTunai_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatanPenjualanTunai_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_pendapatanPenjualanTunai_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanPenjualanTunai_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Penjualan Non Tunai</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText
                                            style={{ width: '20%', borderRadius: '5px' }}
                                            value={configPembukuan.rek_pendapatanPenjualanNonTunai_toko?.rekening}
                                            onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatanPenjualanNonTunai_toko')}
                                        />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_pendapatanPenjualanNonTunai_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanPenjualanNonTunai_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Kas</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_kas_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_kas_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_kas_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_kas_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Bank</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_bank_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_bank_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_bank_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_bank_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>E-Payment</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_epayment_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_epayment_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_epayment_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_epayment_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Point</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_point_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_point_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_point_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_point_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Donasi</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_donasi_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_donasi_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_donasi_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_donasi_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Discount</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_disc_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_disc_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_disc_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_disc_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>PPN</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_ppn_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_ppn_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_ppn_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_ppn_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Selisih Penjualan</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_selisihPenjualan_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_selisihPenjualan_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_selisihPenjualan_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_selisihPenjualan_toko?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* PEMBUKUAN */}
                        <TabPanel header="Pembukuan" style={{ width: '100%' }}>
                            {/* Aset */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Aset</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_aset?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_aset')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_aset')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_aset?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Kewajiban */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Kewajiban</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_kewajiban?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_kewajiban')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_kewajiban')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_kewajiban?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Modal */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Modal</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_modal?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_modal')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_modal')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_modal?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Pendapatan */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatan?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatan')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_pendapatan')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatan?.keterangan} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Biaya */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Biaya</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_biaya?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_biaya')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_biaya')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_biaya?.rekening} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                    <Toolbar className="mb-4" right={konfigurasiFooter}></Toolbar>
                </div>
            </div>
            <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
        </div>
    );
}
