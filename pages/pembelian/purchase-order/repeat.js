/**
	 * Nama Program: GODONG POS - Kasir Repeat
	 * Pengembang: Salsabila Emma
	 * Tanggal Pengembangan: 8 Jan 2024
	 * Versi: 1.0.0

	Catatan:
	- Versi 1.0.0 mencakup fungsionalitas Repeat Kasir
	- Read
*/
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
// import TabelSkaleton from '../../../../component/tabel/skaleton';
import { useRouter } from 'next/router';
import { Dropdown } from 'primereact/dropdown';
import { formatDateTable, showError } from '../../../component/GeneralFunction/GeneralFunction';

import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/purchase-order');
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
export default function Repeat({ repeatDialog, setRepeatDialog, btnRepeat, addPo, setAddPo, calculateUpdatedGrandTotalDisc, po, setPo }) {
    const apiEndPointGetRepeat = '/api/purchase_order/repeat';
    const apiEndPointGetRepeatByFaktur = '/api/purchase_order/getdata_repeat';
    const apiEndPointStore = '/api/repeat/store';

    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [addPoTabel, setAddPoTabel] = useState([]);
    const [addPoTabelFilt, setAddPoTabelFilt] = useState([]);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman

    const pajakRef = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'Loading..', header: 'Loading..' }];

    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
    };
    // useEffect(() => {
    // 	if (repeatDialog) {
    // 		toggleRepeat();
    // 	}
    // }, [repeatDialog]);

    useEffect(() => {
        if (repeatDialog) {
            loadLazyData();
        }
    }, [repeatDialog, lazyState]);

    const loadLazyData = async () => {
        // return;
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGetRepeat, lazyState);
            const json = vaTable.data;
            setAddPoTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    // -------------------------------------------------------------------------------------------------< Pencarian Faktur >

    const [inputValue, setInputValue] = useState('');
    const [timer, setTimer] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);

    // -------------------------------------------------------------------------------------------------------< API DataFaktur >
    const [detailFakturDialog, setDetailFakturDialog] = useState(false);

    const onRowSelectRepeat = async (event) => {
        const selectedFaktur = event.data.FAKTUR;
        let requestBody = {
            FAKTUR: selectedFaktur
        };
        try {
            const vaTable = await postData(apiEndPointGetRepeatByFaktur, requestBody);
            const json = vaTable.data.data;
            setPo(json);
            dataFuncCalculate(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }

        setRepeatDialog(false);
    };

    const dataFuncCalculate = async (json) => {
        const detail = json.detail;
        if (detail && Array.isArray(detail)) {
            let _data = detail.map((item) => ({
                ...item,
                QTY: parseInt(item.QTY, 10) // Ubah QTY menjadi integer
            }));
            const funcCalculateArray = [];
            // Iterasi melalui array dan panggil calculateUpdatedGrandTotalDisc untuk setiap elemen
            for (let i = 0; i < _data.length; i++) {
                const data = _data[i];
                const ketAsal = 'dataEdit';
                const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
                funcCalculateArray.push(funcCalculate);
            }

            // Set addItem setelah semua perhitungan selesai
            setAddPo(() => {
                const updatedAddItem = _data.map((data, index) => {
                    const funcCalc = funcCalculateArray[index];
                    return {
                        KODE: data.KODE,
                        BARCODE: data.BARCODE,
                        NAMA: data.NAMA,
                        QTY: funcCalc.updatedQTY,
                        SUPPLIER: data.SUPPLIER,
                        SATUAN: data.SATUAN,
                        HARGABELI: data.HARGABELI,
                        SUBTOTAL: funcCalc.subTotal,
                        HARGADISCQTY: funcCalc.totDiscQty,
                        HARGAPPNQTY: funcCalc.totPpnQty,
                        GRANDTOTAL: funcCalc.updatedGrandTotalDisc
                    };
                });
                return updatedAddItem;
            });
        } else {
            // If detail is not an array or does not exist, set addPo to an empty array
            setAddPo([]);
        }
    };

    const saveRepeat = async (event) => {
        let requestBody = {
            KODESESI_RETUR: 'd'
        };
        try {
            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointStore, requestBody);
            const json = vaTable.data;

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Repeat Berhasil', life: 3000 });
            setRepeatDialog(false);
            setDetailFakturDialog(false);
            setClosingDialog(false);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
            setRepeatDialog(false);
            setDetailFakturDialog(false);
        }
    };

    const [closingDialog, setClosingDialog] = useState(false);
    const closingDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setClosingDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={saveRepeat} />
        </>
    );

    const onHideDialog = () => {
        setlazyState((prevState) => ({
            ...prevState,
            filters: {}
        }));
        setRepeatDialog(false);
    };

    useEffect(() => {
        setAddPoTabelFilt(addPoTabel);
    }, [addPoTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = addPoTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.SUPPLIER) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = addPoTabel;
            } else {
                filtered = addPoTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setAddPoTabelFilt(filtered);
    };
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" />
					&nbsp; */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    {/* <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." /> */}
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    return (
        <div className="grid crud-demo">
            <Toast ref={toast} />
            <Dialog visible={repeatDialog} style={{ width: '95%' }} header="Repeat Order" modal className="p-fluid" onHide={onHideDialog}>
                <hr />
                <DataTable
                    value={addPoTabelFilt}
                    // globalFilter={globalFilter}
                    filters={lazyState.filters}
                    header={header}
                    first={first} // Menggunakan nilai halaman pertama dari state
                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                    paginator
                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                    totalRecords={totalRecords} // Total number of records
                    size="small"
                    loading={loading}
                    emptyMessage="Data Kosong"
                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                    onRowSelect={onRowSelectRepeat}
                    selectionMode="single"
                >
                    <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="SUPPLIER" header="SUPPLIER"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="ALAMAT" header="ALAMAT"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL" body={(rowData) => formatDateTable(rowData.TGL)}></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="JTHTMP" header="JTHTMP" body={(rowData) => formatDateTable(rowData.TGL)}></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="SUBTOTAL"
                        header="SUBTOTAL"
                        body={(rowData) => {
                            const value = rowData.SUBTOTAL ? parseInt(rowData.SUBTOTAL).toLocaleString() : 0;
                            return value;
                        }}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="PAJAK"
                        header="PAJAK"
                        body={(rowData) => {
                            const value = rowData.PAJAK ? parseInt(rowData.PAJAK).toLocaleString() : 0;
                            return value;
                        }}
                    ></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="DISCOUNT"
                        header="DISCOUNT"
                        body={(rowData) => {
                            const value = rowData.DISCOUNT ? parseInt(rowData.DISCOUNT).toLocaleString() : 0;
                            return value;
                        }}
                    ></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="DATETIME" header="DATETIME" body={(rowData) => formatDateTable(rowData.DATETIME)}></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="USERNAME" header="USERNAME"></Column>
                </DataTable>
            </Dialog>
            {/* -----------------------------------------------------------------------------------------< DIALOG VALIDASI CLOSING > */}
            <Dialog visible={closingDialog} header="Confirm" modal footer={closingDialogFooter} onHide={() => setClosingDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Yakin ingin Repeat ?</span>
                </div>
            </Dialog>
        </div>
    );
}
