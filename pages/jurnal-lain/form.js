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
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
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
 * Created on Thu Aug 08 2024 - 01:21:42
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Rekening from '../component/rekening';
import { InputNumber } from 'primereact/inputnumber';
import { Toolbar } from 'primereact/toolbar';
import postData from '../../lib/Axios';
import { convertToISODate, formatDateSave } from '../../component/GeneralFunction/GeneralFunction';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'jspdf-autotable';
import { useRouter } from 'next/router';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/jurnal-lain');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
};

export default function AddJurnalLainLain() {
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointStore = '/api/jurnal-lain/store';
    const toast = useRef(null);
    const router = useRouter();
    const [faktur, setFaktur] = useState(null);
    const [tglTransaksi, setTglTransaksi] = useState(new Date());
    const [jurnalLainLain, setJurnalLainLain] = useState([]);
    const [jurnalLainLainTable, setJurnalLainLainTable] = useState([]);
    const [kodeRekening, setKodeRekening] = useState('');
    const [ketRekening, setKetRekening] = useState('');
    const [loading, setLoading] = useState(false);
    const [rekeningDialog, setRekeningDialog] = useState(false);
    let saldo = 0;
    const [lazyState, setLazyState] = useState({
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
        NamaPerkiraan: null,
        Keterangan: null,
        Debet: null,
        Kredit: null
    });

    const onPage = (event) => {
        setLazyState(event);
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                Key: 'JR',
                Len: 6
            };
            const vaData = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaData.data;
            setFaktur(json);
        } catch (error) {
            const e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...jurnalLainLain };
        _data[`${name}`] = val;
        setJurnalLainLain(_data);
    };

    //  Yang Handle Inputan Number
    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _jurnalLainLain = { ...jurnalLainLain };
        if (name === 'Debet') {
            _jurnalLainLain.Debet = val;
            _jurnalLainLain.Kredit = val ? '0' : jurnalLainLain.Kredit;
        } else if (name === 'Kredit') {
            _jurnalLainLain.Kredit = val;
            _jurnalLainLain.Debet = val ? '0' : jurnalLainLain.Debet;
        } else {
            _jurnalLainLain[`${name}`] = val;
        }
        setJurnalLainLain(_jurnalLainLain);
    };

    // Yang Handle Toggle
    const btnRekening = () => {
        setRekeningDialog(true);
    };

    const handleRekeningData = (rekeningKode, rekeningNama) => {
        setKodeRekening(rekeningKode);
        setKetRekening(rekeningNama);
    };

    // Yang Handle Data Masuk ke Tabel
    const addTabel = () => {
        if (jurnalLainLain.Keterangan == null || jurnalLainLain.Keterangan == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Keterangan Masih Kosong!', life: 3000 });
            return;
        }

        if (kodeRekening == null || kodeRekening == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Rekening Belum Dipilih!', life: 3000 });
            return;
        }

        if ((jurnalLainLain.Debet == null && jurnalLainLain.Kredit == null) || (jurnalLainLain.Debet == 0 && jurnalLainLain.Kredit == 0)) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Debet/Kredit Harus Lebih Dari 0!', life: 3000 });
            return;
        }

        let newEntry = {
            Rekening: kodeRekening,
            NamaPerkiraan: ketRekening,
            Keterangan: jurnalLainLain.Keterangan,
            Debet: jurnalLainLain.Debet,
            Kredit: jurnalLainLain.Kredit
        };
        setJurnalLainLainTable([...jurnalLainLainTable, newEntry]);
        // Reset form fields after adding the entry
        setJurnalLainLain({ Keterangan: '', Debet: '', Kredit: '' });
        setKodeRekening('');
        setKetRekening('');
        setTglTransaksi(null);
    };

    //  Yang Handle Delete Row
    const deleteRow = (index) => {
        let updatedTable = [...jurnalLainLainTable];
        updatedTable.splice(index, 1);
        setJurnalLainLainTable(updatedTable);
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'Data Berhasil Dihapus' });
    };

    //  Yang Handle Save Data
    const createDataObject = (_jurnalLainLain, _jurnalLainLainTable) => {
        let data = {
            Faktur: faktur,
            Tgl: _jurnalLainLain.Tgl ? convertToISODate(_jurnalLainLain.Tgl) : convertToISODate(new Date()),
            tabelJurnalLain: _jurnalLainLainTable
                .map((item) => {
                    return {
                        Rekening: item.Rekening,
                        Keterangan: item.Keterangan,
                        Debet: item.Debet ?? 0,
                        Kredit: item.Kredit ?? 0
                    };
                })
                .filter((item) => item !== null)
        };
        return data;
    };

    const saveJurnalLainLain = async (e) => {
        e.preventDefault();
        let _jurnalLainLain = { ...jurnalLainLain };
        let _jurnalLainLainTable = [...jurnalLainLainTable];
        let _data = createDataObject(_jurnalLainLain, _jurnalLainLainTable);

        if (_data.Faktur == null || _data.Faktur == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            return;
        }
        if (_data.tabelJurnalLain.length <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong!', life: 3000 });
            return;
        }
        if (saldo != 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Jurnal Tidak Balance!', life: 3000 });
            return;
        }

        try {
            // return console.log(_data);

            const vaData = await postData(apiEndPointStore, _data);

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
            router.push('/jurnal-lain');
        } catch (error) {
            const e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Terjadi Kesalahan', life: 3000 });
        }
    };

    const actionBodyTemplate = (rowData, column) => {
        return <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => deleteRow(column.rowIndex)} />;
    };

    const indexBodyTemplate = (rowData, column) => {
        return column.rowIndex + 1;
    };

    const rightFooterTemplate = (rowData) => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveJurnalLainLain} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/jurnal-lain');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    // Yang Handle Footer
    const totDebet =
        jurnalLainLainTable?.reduce((accumulator, item) => {
            const totDebetValue = parseFloat(item.Debet);
            return isNaN(totDebetValue) ? accumulator : accumulator + totDebetValue;
        }, 0) ?? 0;

    const totKredit =
        jurnalLainLainTable?.reduce((accumulator, item) => {
            const totKreditValue = parseFloat(item.Kredit);
            return isNaN(totKreditValue) ? accumulator : accumulator + totKreditValue;
        }, 0) ?? 0;

    saldo = totDebet - totKredit;
    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column footer="Total:" colSpan={4} footerStyle={{ textAlign: 'right' }} />
                <Column colSpan={1} footer={`${totDebet.toLocaleString()}`} />
                <Column colSpan={2} footer={`${totKredit.toLocaleString()}`} />
            </Row>
        </ColumnGroup>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Add Jurnal Lain-Lain</h4>
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={faktur}></InputText>
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="tgl">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar value={jurnalLainLain.Tgl ? new Date(jurnalLainLain.Tgl) : new Date()} onChange={(e) => onInputChange(e, 'Tgl')} id="tgl" showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="keterangan">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText id="keterangan" Name="keterangan" autoFocus value={jurnalLainLain.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="rekening">Rekening</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={kodeRekening} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnRekening} />
                                    <InputText readOnly value={ketRekening} />
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="debet">Jumlah Debet</label>
                                <div className="p-inputgroup">
                                    <InputNumber inputStyle={{ textAlign: 'right' }} id="debet" Name="debet" value={jurnalLainLain.Debet} min={0} onChange={(e) => onInputNumberChange(e, 'Debet')} required />
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="kredit">Jumlah Kredit</label>
                                <div className="p-inputgroup">
                                    <InputNumber inputStyle={{ textAlign: 'right' }} id="kredit" Name="kredit" value={jurnalLainLain.Kredit} min={0} onChange={(e) => onInputNumberChange(e, 'Kredit')} required />
                                </div>
                            </div>
                            <div className="field button-field">
                                <Button label="Tambah" severity="success" className="ok-button" onClick={addTabel} style={{ marginTop: '20px' }} />
                            </div>
                        </div>
                    </div>
                    <hr></hr>
                    <DataTable
                        loading={loading}
                        value={jurnalLainLainTable}
                        size="small"
                        lazy
                        rows={10}
                        editMode="cell"
                        className="datatable-responsive editable-cells-"
                        responsiveLayout="scroll"
                        first={lazyState.first}
                        onPage={onPage}
                        scrollable
                        scrollHeight="200px"
                        footerColumnGroup={footerGroup}
                    >
                        <Column body={indexBodyTemplate} header="NO" style={{ width: '50px', textAlign: 'center' }}></Column>
                        <Column field="Rekening" header="REKENING"></Column>
                        <Column field="NamaPerkiraan" header="NAMA PERKIRAAN"></Column>
                        <Column field="Keterangan" header="KETERANGAN"></Column>
                        <Column
                            field="Debet"
                            body={(rowData) => {
                                // Check if Debet is 0 or undefined/null
                                const value = rowData.Debet && parseFloat(rowData.Debet) !== 0 ? parseFloat(rowData.Debet).toLocaleString() : ''; // If Debet is 0, display an empty string
                                return value;
                            }}
                            header="DEBET"
                        ></Column>
                        <Column
                            field="Kredit"
                            body={(rowData) => {
                                // Check if Kredit is 0 or undefined/null
                                const value = rowData.Kredit && parseFloat(rowData.Kredit) !== 0 ? parseFloat(rowData.Kredit).toLocaleString() : ''; // If Kredit is 0, display an empty string
                                return value;
                            }}
                            header="KREDIT"
                        ></Column>

                        <Column body={actionBodyTemplate} header="ACTION"></Column>
                    </DataTable>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
                </div>
            </div>
            <Rekening rekeningDialog={rekeningDialog} setRekeningDialog={setRekeningDialog} btnRekening={btnRekening} handleRekeningData={handleRekeningData} />
        </div>
    );
}
