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
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu booking perusahaan yang bernilai.
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
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
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
    const apiEndPointGetPembelian = '/api/setup/coa/get-pembelian';
    const apiEndPointGetToko = '/api/setup/coa/get-toko';
    const apiEndPointGetPiutang = '/api/setup/coa/get-piutang';
    const apiEndPointGetAdj = '/api/setup/coa/get-adj';
    const apiEndPointGetPembukuan = '/api/setup/coa/get-pembukuan';
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

    const toggleDataTableRekening = async (event) => {
        setActiveIndexRekening(event.index);
        let _lazyStateRekening = { ...lazyStateRekening };
        _lazyStateRekening['filters']['kode'] = event.index + 1;
        setlazyStateRekening(_lazyStateRekening);
    };

    // Yang Handle Save Data
    const saveKonfigurasi = async (e) => {
        e.preventDefault();
        // return console.log(configPembukuan);

        const combinedConfig = {
            // Pembukuan
            Aset: configPembukuan.Aset || ''
        };

        if (typeof combinedConfig === 'undefined' || Object.keys(combinedConfig).length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Kosong', life: 3000 });
            return;
        }

        try {
            setLoading(true);
            const vaData = await postData(apiEndPointStore, combinedConfig);
            const json = vaData.data.data;

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
    const toggleRekening = async (event, formField) => {
        try {
            setLoadingItem(true);
            setRekeningDialog(true);
            setActiveFormField(formField);
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
        toggleRekening(event, formField);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        console.log(selectedRow);
        //  Menentukan FormField yang Sesuai
        switch (formField) {
            // ----------------------------------Pembukuan
            case 'booking':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    booking: selectedRow.kode,
                    ketBooking: selectedRow.keterangan
                }));
                break;
            case 'sewa':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    sewa: selectedRow.kode,
                    ketSewa: selectedRow.keterangan
                }));
                break;
            case 'diskon':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    diskon: selectedRow.kode,
                    ketDiskon: selectedRow.keterangan
                }));
                break;

            default:
                break;
        }
        setRekeningDialog(false);
    };

    const MyDataTable = ({ formField, onRowSelect }) => {
        return (
            <TabView activeIndex={activeIndexRekening} onTabChange={toggleDataTableRekening}>
                <TabPanel header="ASET">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(1)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="kode" header="kode" />
                            <Column field="keterangan" header="keterangan" />
                            <Column field="jenis_rekening" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="KEWAJIBAN">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(2)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="kode" header="kode" />
                            <Column field="keterangan" header="keterangan" />
                            <Column field="jenis_rekening" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="MODAL">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(3)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="kode" header="kode" />
                            <Column field="keterangan" header="keterangan" />
                            <Column field="jenis_rekening" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="PENDAPATAN">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(4)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="kode" header="kode" />
                            <Column field="keterangan" header="keterangan" />
                            <Column field="jenis_rekening" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="HPP">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(5)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="kode" header="kode" />
                            <Column field="keterangan" header="keterangan" />
                            <Column field="jenis_rekening" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="BIAYA">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(6)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="kode" header="kode" />
                            <Column field="keterangan" header="keterangan" />
                            <Column field="jenis_rekening" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
            </TabView>
        );
    };

    const filterDataByType = (type) => {
        return rekeningTable?.filter((item) => {
            // Ambil angka pertama dari kode
            const firstDigit = parseInt(item.kode.charAt(0));
            // Cocokkan dengan jenis booking
            return firstDigit === type;
        });
    };

    const bodyJenisRekening = (rowData) => {
        return <span>{rowData.jenis_rekening == 'I' ? 'INDUK' : 'DETAIL'}</span>;
    };

    const headerRekening = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" />
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    const onSearch = (value) => {
        let _lazyStateRekening = { ...lazyStateRekening };
        _lazyStateRekening['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyStateRekening['filters'][defaultOption.label] = value;
        }
        onPage(_lazyStateRekening);
    };

    const onInputChangePembukuan = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _pembukuan = { ...configPembukuan };
        _pembukuan[`${name}`] = val;
        setConfigPembukuan(_pembukuan);
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
                        {/* PEMBUKUAN */}
                        <TabPanel header="Pembukuan" style={{ width: '100%' }}>
                            {/* Booking/dp */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Booking</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.booking} onChange={(e) => onInputChangePembukuan(e, 'booking')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('booking')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.ketBooking} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* sewa */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Sewa</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.sewa} onChange={(e) => onInputChangePembukuan(e, 'sewa')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('sewa')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.ketSewa} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* diskon */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Diskon</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.diskon} onChange={(e) => onInputChangePembukuan(e, 'diskon')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('diskon')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.ketDiskon} readOnly />
                                    </div>
                                </div>
                            </div>

                            {/* ppn */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Ppn</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.ppn} onChange={(e) => onInputChangePembukuan(e, 'ppn')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('diskon')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.ketPpn} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                    <Toolbar className="mb-4" right={konfigurasiFooter}></Toolbar>
                </div>
            </div>
            <Dialog visible={rekeningDialog} style={{ width: '450px' }} header="Rekening" diskon className="p-fluid" onHide={() => setRekeningDialog(false)}>
                {/* ---------------------------------------------------------------------------------< Pembukuan > */}
                {activeFormField === 'booking' && <MyDataTable formField="booking" onRowSelect={onRowSelectKode} />}
                {activeFormField === 'sewa' && <MyDataTable formField="sewa" onRowSelect={onRowSelectKode} />}
                {activeFormField === 'diskon' && <MyDataTable formField="diskon" onRowSelect={onRowSelectKode} />}
                {activeFormField === 'ppn' && <MyDataTable formField="ppn" onRowSelect={onRowSelectKode} />}
            </Dialog>
        </div>
    );
}
