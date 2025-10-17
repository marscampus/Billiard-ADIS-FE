import { startOfMonth } from 'date-fns';
import { useRouter } from 'next/router';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { formatDate, getYMD, showError } from '../../../component/GeneralFunction/GeneralFunction';
import styles from '../../../component/styles/dataTable.module.css';
import Rekening from '../../component/rekening';
import Supplier from '../../component/supplier';

import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
export async function getServerSideProps(context) {
    //   const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    const sessionData = await getSessionServerSide(context, '/pembelian/pembayaran-faktur');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterBayarFaktur() {
    //hubungan dengan path api disini
    const apiDirPath = '/api/api_crud_kode/';
    //get faktur
    const apiEndPointGetFaktur = '/api/pembayaran_faktur/get_faktur';
    // get data by supplier & periode
    const apiEndPointGetDataBySupplier = '/api/pembayaran_faktur/getdata_bysupplier';
    //store bayar faktur
    const apiEndPointStore = '/api/pembayaran_faktur/store';

    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [supplierCari, setSupplierCari] = useState(null);
    const [keteranganSupplier, setKeteranganSupplier] = useState('');
    const [bayarFaktur, setBayarFaktur] = useState([]);
    const [bayarFakturTabel, setBayarFakturTabel] = useState([]);
    const [faktur, setFaktur] = useState(null);

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

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    useEffect(() => {
        loadBayarFaktur();
    }, [lazyState]);

    const loadBayarFaktur = async () => {
        setLoading(true);
        try {
            let requestBody = {
                KODE: 'PH',
                LEN: '6'
            };
            const vaTable = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaTable.data.data;
            console.log('json', json);
            // setTotalRecords(json.total);
            setFaktur(json);
            setBayarFaktur((prevBayarFaktur) => ({
                ...prevBayarFaktur,
                FAKTUR: json
            }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const loadLazyData = async (supplierKode) => {
        setLoading(true);
        try {
            let requestBody = {
                Supplier: supplierKode
            };
            const vaTable = await postData(apiEndPointGetDataBySupplier, requestBody);
            const json = vaTable.data.data || [];
            // return console.log('json', json);
            setTotalRecords(json.total);
            const bayarFakturTabelWithStatus = json?.map((entry) => ({
                ...entry,
                STATUS: entry.TOTALTERIMA - entry.PEMBAYARAN === 0 ? 'L' : 'B'
            }));

            setBayarFakturTabel(bayarFakturTabelWithStatus);
            // setBayarFakturTabel(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...bayarFaktur };
        _data[`${name}`] = val;
        setBayarFaktur(_data);
        // console.log(_data);
    };
    // ----------------------------------------------------------------------------------------------------------------- Handle Change
    const [statusFilter, setStatusFilter] = useState('B'); // Ganti nama state menjadi statusFilter

    const handleRadioChangeStatus = (event) => {
        setStatusFilter(event.target.value); // Perbarui status filter sesuai nilai radio button yang dipilih
    };
    //  ------------------------------------------------------------------------------------------------------------------ edit in cell

    const textEditor = (options) => {
        return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };
    const isPositiveInteger = (value) => {
        const parsedValue = parseInt(value, 10);
        return Number.isInteger(parsedValue) && parsedValue > 0;
    };

    const deleteSelectedRow = (rowData) => {
        const updatedPembayaranFaktur = bayarFakturTabel.filter((row) => row !== rowData);
        setBayarFakturTabel(updatedPembayaranFaktur);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        console.log(newValue);
        switch (field) {
            case 'PEMBAYARAN':
                let editPembayaran = parseInt(newValue);
                if (editPembayaran === 0) {
                    deleteSelectedRow(rowData);
                } else if (newValue === '' || newValue === undefined) {
                    const updatedPembayaranFaktur = bayarFakturTabel.map((item) => {
                        if (item.FAKTURPEMBELIAN === rowData.FAKTURPEMBELIAN) {
                            const addedData = rowData;
                            console.log('addedData', addedData);
                            return { ...item, PEMBAYARAN: addedData.TOTALTERIMA };
                        } else {
                            return { ...item };
                        }
                    });
                    setBayarFakturTabel(updatedPembayaranFaktur);
                } else {
                    // const existingIndex = bayarFakturTabel.findIndex((item) => item.FAKTURPO === rowData.FAKTURPO);
                    const updatedPembayaranFaktur = bayarFakturTabel.map((item) => {
                        if (item.FAKTURPEMBELIAN === rowData.FAKTURPEMBELIAN) {
                            const addedData = rowData;
                            const addedSisa = addedData.VALSISA;
                            const reversedSisa = addedSisa < 0 ? -addedSisa : addedSisa;
                            const sisa = reversedSisa - editPembayaran;
                            return { ...item, PEMBAYARAN: editPembayaran, SISA: sisa };
                        } else {
                            return { ...item };
                        }
                    });
                    setBayarFakturTabel(updatedPembayaranFaktur);
                }
                break;
            default:
                break;
        }
    };
    const cellEditor = (options) => {
        return textEditor(options);
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
        console.log('supplierKode', supplierKode);
        console.log('supplierNama', supplierNama);
        loadLazyData(supplierKode);
    };

    // -----------------------------------------------------------------------------------------------------------------< Rekening >
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [rekeningKode, setRekeningKode] = useState('');
    const [rekeningNama, setRekeningNama] = useState('');
    const btnRekening = () => {
        setRekeningDialog(true);
    };
    const handleRekeningData = (rekeningKode, rekeningNama, rekeningJenis) => {
        if (rekeningJenis === 'D') {
            setRekeningKode(rekeningKode);
            setRekeningNama(rekeningNama);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Rekening Induk tidak bisa dipilih', life: 3000 });
            return;
        }
    };

    // -------------------------------------------------------------------------------------------------------------------- Func

    const convertUndefinedToNull = (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertUndefinedToNull(obj[key]); // Memanggil fungsi rekursif jika nilai properti adalah objek
                } else if (obj[key] === undefined) {
                    obj[key] = null; // Mengubah nilai undefined menjadi null
                }
            }
        }
    };
    const createDataObject = (_bayarFaktur, _bayarFakturTabel) => {
        const data = {
            FAKTUR: _bayarFaktur.FAKTUR,
            TGL: getYMD(new Date()),
            SUPPLIER: _bayarFaktur.SUPPLIER || supplierKode,
            REKENING: _bayarFaktur.REKENING || rekeningKode,
            tabelPembayaranFaktur: _bayarFakturTabel.map((item) => {
                convertUndefinedToNull(item);
                return {
                    FAKTURPEMBELIAN: item.FAKTURPEMBELIAN,
                    PEMBAYARAN: item.PEMBAYARAN,
                    JTHTMP: item.JTHTMP
                };
            })
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        e.preventDefault();
        let _bayarFaktur = { ...bayarFaktur };
        let _bayarFakturTabel = [...bayarFakturTabel];
        let _data = createDataObject(_bayarFaktur, _bayarFakturTabel);
        if (_data.REKENING === null || _data.REKENING === undefined || _data.REKENING === '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Pembayaran Belum Dipilih', life: 3000 });
            return;
        }

        if (_bayarFakturTabel.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Faktur Kosong', life: 3000 });
            return;
        }
        // return;
        try {
            const vaTable = await postData(apiEndPointStore, _data);
            let data = vaTable.data;
            console.log('data', data);
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
            router.push('/pembelian/pembayaran-faktur');
            window.location.reload();
            // if (data.code === '200') {
            // } else {
            //     toast.current.show({ severity: 'error', summary: data.message, detail: data.messageValidator, life: 3000 });
            // }
            // if (data.status === 'success') {
            //     toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Berhasil Disimpan', life: 5000 });
            //     // setNull();
            //     router.push('/pembelian/pembayaran-faktur');
            //     window.location.reload();
            // } else {
            //     toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            // }
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    // ---------------------------------------------------------------------------------------------------------------- Footer

    const dataFooter = bayarFakturTabel.filter((row) => (statusFilter === 'B' ? row.PEMBAYARAN !== 0 : row.PEMBAYARAN === 0));
    const totJumlah = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.JUMLAHPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totData = dataFooter.length;
    const totDisc = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.DISCOUNTPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totPpn = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.PAJAKPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totTotal = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.TOTALPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totTerima = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.TOTALTERIMA);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totRetur = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.TOTALRETUR);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totPembayaran = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.PEMBAYARAN);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={1} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totData.toLocaleString()} Faktur`} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={2} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totJumlah.toLocaleString()}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totDisc.toLocaleString()}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totPpn.toLocaleString()}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totTotal.toLocaleString()}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totTerima.toLocaleString()}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totRetur.toLocaleString()}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totPembayaran.toLocaleString()}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={2} />
            </Row>
        </ColumnGroup>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Pembayaran Faktur</h4>
                    <hr />
                    <Toast ref={toast} />

                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="">Faktur Bayar</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={faktur} />
                                    </div>
                                </div>
                                {/* <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="faktur">Periode</label>
                                    <div className="p-inputgroup">
                                        <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                        <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                        <Button label="" icon="pi pi-calendar" className="p-button-primary mr-2" readOnly />
                                    </div>
                                </div> */}
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label>Supplier</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={bayarFaktur.SUPPLIER || supplierKode} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                        <InputText readOnly value={supplierNama} />
                                        {/* <Button label="Cari" icon="pi pi-refresh" className="p-button-primary" onClick={btnCari} /> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                {/* <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="Pembayaran" style={{ marginBottom: '15px' }}>
                                        Pilih Metode Pembayaran
                                    </label>
                                    <div className="p-inputgroup">
                                        <RadioButton name="Pembayaran" value="T" checked={bayarFaktur.Pembayaran === 'T'} onChange={(e) => onInputChange(e, 'Pembayaran')} />
                                        <label htmlFor="ingredient1" className="mr-3 ml-2">
                                            Tunai
                                        </label>
                                        <RadioButton name="Pembayaran" value="C" checked={bayarFaktur.Pembayaran === 'C'} onChange={(e) => onInputChange(e, 'Pembayaran')} />
                                        <label htmlFor="ingredient1" className="mr-3 ml-2">
                                            Giro/Cek
                                        </label>
                                        <RadioButton name="Pembayaran" value="M" checked={bayarFaktur.Pembayaran === 'M'} onChange={(e) => onInputChange(e, 'Pembayaran')} />
                                        <label htmlFor="ingredient1" className="mr-3 ml-2">
                                            Memorial
                                        </label>
                                    </div>
                                </div> */}
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="Pembayaran" style={{ marginBottom: '15px' }}>
                                        Status
                                    </label>
                                    <div className="p-inputgroup">
                                        <RadioButton inputId="tunai" value="B" checked={statusFilter === 'B'} onChange={handleRadioChangeStatus} className="mr-2" />
                                        <div className="mr-2">
                                            <Badge value="Belum Lunas" severity="secondary" size="small" className="mb-2 mr-2"></Badge>
                                        </div>
                                        <RadioButton inputId="girocek" value="L" checked={statusFilter === 'L'} onChange={handleRadioChangeStatus} className="mr-2" />
                                        <div className="mr-2">
                                            <Badge value="Lunas" severity="success" size="small" className="mb-2 mr-2"></Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label>Pembayaran</label>
                                    <div className="p-inputgroup">
                                        <InputText value={bayarFaktur.REKENING || rekeningKode} onChange={(e) => onInputChange(e, 'REKENING')} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnRekening} />
                                        <InputText readOnly value={rekeningNama} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.datatableContainer}>
                        <DataTable
                            // value={bayarFakturTabel}
                            value={bayarFakturTabel.filter((row) => (statusFilter === 'B' ? row.PEMBAYARAN !== 0 : row.PEMBAYARAN === 0))} // Filter data sesuai status filter
                            lazy
                            dataKey="KODE_TOKO"
                            // paginator
                            // rows={10}

                            className="datatable-responsive"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                            footerColumnGroup={footerGroup}
                            size="small"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="FAKTURPO" header="FAKTUR PO" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="FAKTURPEMBELIAN"
                                header="FKT PEMBELIAN"
                                body={(rowData) => <Badge value={rowData.FAKTURPEMBELIAN} severity={rowData.PEMBAYARAN === 0 ? 'success' : 'secondary'} size="small" />}
                                bodyStyle={{ textAlign: 'center' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL" body={(rowData) => formatDate(rowData.TGL)} bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="JTHTMP" header="JTHTMP" body={(rowData) => formatDate(rowData.JTHTMP)} bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="JUMLAHPO" header="JUMLAH PO" body={(rowData) => (rowData.JUMLAHPO ? `${rowData.JUMLAHPO.toLocaleString()}` : '0')} bodyStyle={{ textAlign: 'right' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNTPO" header="DISCOUNT" body={(rowData) => (rowData.DISCOUNTPO ? `${rowData.DISCOUNTPO.toLocaleString()}` : '0')} bodyStyle={{ textAlign: 'right' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="PAJAKPO" header="PPN" body={(rowData) => (rowData.PAJAKPO ? `${rowData.PAJAKPO.toLocaleString()}` : '0')} bodyStyle={{ textAlign: 'right' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TOTALPO" header="TOTAL PO" body={(rowData) => (rowData.TOTALPO ? `${rowData.TOTALPO.toLocaleString()}` : '0')} bodyStyle={{ textAlign: 'right' }}></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="TOTALTERIMA"
                                header="TOTAL TERIMA"
                                body={(rowData) => (rowData.TOTALTERIMA ? `${rowData.TOTALTERIMA.toLocaleString()}` : '0')}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="TOTALRETUR"
                                header="TOTAL RETUR"
                                body={(rowData) => {
                                    const value = rowData.TOTALRETUR ? parseInt(rowData.TOTALRETUR).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="PEMBAYARAN"
                                header="PEMBAYARAN"
                                body={(rowData) => {
                                    const value = rowData.PEMBAYARAN ? parseInt(rowData.PEMBAYARAN).toLocaleString() : 0;
                                    return value;
                                }}
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="SISA"
                                header="SISA"
                                body={(rowData) => {
                                    const value = rowData.SISA ? parseInt(rowData.SISA).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TIPE" header="TIPE"></Column>
                        </DataTable>
                        <br></br>
                    </div>
                    <div className="text-right">
                        <Button label="Save" className="p-button-primary" onClick={saveData} />
                    </div>
                    {/* ------------------------------------------------------------------------------------------------------------------------- Dialog Supplier */}
                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <Rekening rekeningDialog={rekeningDialog} setRekeningDialog={setRekeningDialog} btnRekening={btnRekening} handleRekeningData={handleRekeningData} />
                </div>
            </div>
        </div>
    );
}
