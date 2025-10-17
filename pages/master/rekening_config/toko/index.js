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
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu perusahaan yang bernilai.
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
import { getSessionServerSide } from '../../../../utilities/servertool';
import { TabPanel, TabView } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import postData from '../../../../lib/Axios';
import { ProgressBar } from 'primereact/progressbar';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import MultipleRekeningCOA from '../../../component/MultipleRekeningCOA';
import { showError } from '../../../../component/GeneralFunction/GeneralFunction';

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
    const apiEndPointGetPembukuan = '/api/config/get-all';
    const apiEndPointGetRekening = '/api/rekening/get';
    const apiEndPointStore = '/api/setup/coa/store';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeIndexRekening, setActiveIndexRekening] = useState(0);

    const [pembukuanLoaded, setPembukuanLoaded] = useState(false);

    const [configPembukuan, setConfigPembukuan] = useState([]);

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
            const vaTable = await postData(apiEndPointGetPembukuan, { kode: ['*'] });
            const json = vaTable.data.data;
            console.log(json);
            setConfigPembukuan(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
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

        const namaRekening = Object.keys(configPembukuan);

        const body = namaRekening.reduce((acc, item) => {
            acc[item] = configPembukuan[item].rekening;
            return acc;
        }, {});

        // return console.log(body);

        if (Object.keys(body).length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Kosong', life: 3000 });
            return;
        }

        try {
            setLoading(true);
            const key = Object.keys(body);
            const keterangan = Object.values(body);

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
            showError(toast, e?.message || 'Terjadi Kesalahan');
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
            showError(toast, e?.message || 'Terjadi Kesalahan');
            setRekeningTable([]);
        } finally {
            setLoadingItem(false);
        }
    };

    const handleSearchButtonClick = (formField) => () => {
        setActiveFormField(formField);
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event) => {
        const selectedRow = event.data;

        // if (selectedRow.jenis_rekening === 'I') {
        //     showError(toast,'Rekening Induk Tidak Boleh Dipilih');
        //     return;
        // }

        if (!activeFormField) {
            showError(toast, 'Form field tidak valid');
            return;
        }

        setConfigPembukuan((prev) => ({
            ...prev,
            [activeFormField]: {
                rekening: selectedRow.kode,
                keterangan: selectedRow.keterangan
            }
        }));

        setRekeningDialog(false);
    };

    const onInputChangePembukuan = (e, name) => {
        const val = e.target?.value || '';

        setConfigPembukuan((prev) => ({
            ...prev,
            [name]: {
                ...prev[name],
                rekening: val
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
                        {/* PEMBELIAN */}
                        <TabPanel header="Pembelian" style={{ width: '100%' }}>
                            {/* Pembelian Kredit */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pembelian Kredit</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_pembelianKredit_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_pembelianKredit_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_pembelianKredit_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pembelianKredit_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Pembelian Tunai */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pembelian Tunai</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_pembelianTunai_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_pembelianTunai_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_pembelianTunai_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pembelianTunai_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Hutang Dagang */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Hutang Dagang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_hutangDagang_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_hutangDagang_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_hutangDagang_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_hutangDagang_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Disc Hutang Dagang */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Disc Hutang Dagang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_discHutangDagang_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_discHutangDagang_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_discHutangDagang_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_discHutangDagang_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* PPN Hutang Dagang */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>PPN Hutang Dagang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_ppnHutangDagang_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_ppnHutangDagang_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_ppnHutangDagang_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_ppnHutangDagang_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* PIUTANG */}
                        <TabPanel header="Piutang" style={{ width: '100%' }}>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Admin Piutang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_adminPiutang_toko?.rekening} onChange={(e) => onInputChangePembukuan(e, 'rek_adminPiutang_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_adminPiutang_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_adminPiutang_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        {/* TOKO */}
                        <TabPanel header="Toko" style={{ width: '100%' }}>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Penjualan Tunai</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText
                                            style={{ width: '20%', borderRadius: '5px' }}
                                            value={configPembukuan.rek_pendapatanPenjualanTunai_toko?.rekening || ''}
                                            onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatanPenjualanTunai_toko')}
                                        />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanPenjualanTunai_toko?.keterangan || ''} readOnly />
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
                                            value={configPembukuan.rek_pendapatanPenjualanNonTunai_toko?.rekening || ''}
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanPenjualanNonTunai_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_kas_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_kas_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_kas_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_bank_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_bank_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_bank_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_epayment_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_epayment_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_epayment_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_point_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_point_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_point_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_donasi_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_donasi_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_donasi_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_disc_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_disc_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_disc_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_ppn_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_ppn_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_ppn_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_selisihPenjualan_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_selisihPenjualan_toko')} />
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
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_selisihPenjualan_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* ADJUSTMENT */}
                        <TabPanel header="Adjustment" style={{ width: '100%' }}>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>HPP</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_hpp_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_hpp_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_hpp_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_hpp_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Aset Nilai Persediaan</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_asetNilaiPersediaan_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_asetNilaiPersediaan_toko')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rek_asetNilaiPersediaan_toko')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_asetNilaiPersediaan_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_aset_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_aset_toko')} />
                                        <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_aset_toko')} className="p-button" style={{ 'margin-left': '5px', 'margin-right': '5px', borderRadius: '5px' }} />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_aset_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_kewajiban_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_kewajiban_toko')} />
                                        <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_kewajiban_toko')} className="p-button" style={{ 'margin-left': '5px', 'margin-right': '5px', borderRadius: '5px' }} />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_kewajiban_toko?.keterangan || ''} readOnly />
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
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_modal_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_modal_toko')} />
                                        <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_modal_toko')} className="p-button" style={{ 'margin-left': '5px', 'margin-right': '5px', borderRadius: '5px' }} />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_modal_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Pendapatan Operasional */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Operasional</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_pendapatanOperasionalAwal_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatanOperasionalAwal_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_pendapatanOperasionalAwal_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanOperasionalAwal_toko?.keterangan || ''} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_pendapatanOperasionalAkhir_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatanOperasionalAkhir_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_pendapatanOperasionalAkhir_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanOperasionalAkhir_toko?.keterangan || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Harga Pokok Penjualan */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Harga Pokok Penjualan</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_hppAwal_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_hppAwal_toko')} />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_hppAwal_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_hppAwal_toko?.keterangan || ''} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_hppAkhir_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_hppAkhir_toko')} />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_hppAkhir_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_hppAkhir_toko?.keterangan || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Biaya Admin dan Umum */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Biaya Admin dan Umum</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_biayaAdminDanUmumAwal_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_biayaAdminDanUmumAwal_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_biayaAdminDanUmumAwal_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_biayaAdminDanUmumAwal_toko?.keterangan || ''} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_biayaAdminDanUmumAkhir_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_biayaAdminDanUmumAkhir_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_biayaAdminDanUmumAkhir_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_biayaAdminDanUmumAkhir_toko?.keterangan || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Pendapatan Non Operasional */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Non Operasional</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_pendapatanNonOperasionalAwal_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatanNonOperasionalAwal_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_pendapatanNonOperasionalAwal_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanNonOperasionalAwal_toko?.keterangan || ''} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_pendapatanNonOperasionalAkhir_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_pendapatanNonOperasionalAkhir_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_pendapatanNonOperasionalAkhir_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pendapatanNonOperasionalAkhir_toko?.keterangan || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Biaya Non Operasional */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Biaya Non Operasional</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_biayaNonOperasionalAwal_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_biayaNonOperasionalAwal_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_biayaNonOperasionalAwal_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_biayaNonOperasionalAwal_toko?.keterangan || ''} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText
                                                style={{ width: '20%', borderRadius: '5px' }}
                                                value={configPembukuan.rek_biayaNonOperasionalAkhir_toko?.rekening || ''}
                                                onChange={(e) => onInputChangePembukuan(e, 'rek_biayaNonOperasionalAkhir_toko')}
                                            />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_biayaNonOperasionalAkhir_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_biayaNonOperasionalAkhir_toko?.keterangan || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Pajak */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pajak</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_pajakAwal_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_pajakAwal_toko')} />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_pajakAwal_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pajakAwal_toko?.keterangan || ''} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_pajakAkhir_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_pajakAkhir_toko')} />
                                            <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_pajakAkhir_toko')} className="p-button" style={{ marginLeft: '5px', marginRight: '5px', borderRadius: '5px' }} />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_pajakAkhir_toko?.keterangan || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Rekening Laba */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Rekening Laba</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_rekeningLaba_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_rekeningLaba_toko')} />
                                        <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_rekeningLaba_toko')} className="p-button" style={{ 'margin-left': '5px', 'margin-right': '5px', borderRadius: '5px' }} />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_rekeningLaba_toko?.keterangan || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Rekening Laba Tahun Lalu */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Rekening Laba Tahun Lalu</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.rek_rekeningLabaTahunLalu_toko?.rekening || ''} onChange={(e) => onInputChangePembukuan(e, 'rek_rekeningLabaTahunLalu_toko')} />
                                        <Button icon="pi pi-search" onClick={handleSearchButtonClick('rek_rekeningLabaTahunLalu_toko')} className="p-button" style={{ 'margin-left': '5px', 'margin-right': '5px', borderRadius: '5px' }} />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.rek_rekeningLabaTahunLalu_toko?.keterangan || ''} readOnly />
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
