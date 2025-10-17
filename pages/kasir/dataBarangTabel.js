/**
 * Nama Program: GODONG POS - Data Barang Tabel
 * Pengembang: Salsabila Emma
 * Tanggal Pengembangan: 3 Jan 2024
 * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Data Barang Tabel
 */
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { formatRibuan } from '../../component/GeneralFunction/GeneralFunction';
import Payment from './payment';
import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
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
function DataBarangTabel({ onQtyUpdate, addItem, setAddItem, calculateUpdatedGrandTotalDisc, dataShift, selectedSesi, isChecked }) {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);

    const toast = useRef(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const onPage = (event) => {
        setlazyState(event);
    };
    useEffect(() => {
        // -------------menandakan ada promo tidak
        // const promo = json.DISKONPERIODE === 'ADA';
        console.log('dataShifPadaDataBarangTabel => ', dataShift);
        // setIsPromo(promo);
    }, []);

    // ----------------------------------------------------------------------------< edit in cell >
    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;

        switch (field) {
            case 'QTY':
                if (!isNaN(newValue)) {
                    // return console.log('rowData',rowData)
                    // Check if newValue is a valid number
                    // const editedQty = parseFloat(newValue);
                    let editedQty;
                    if (rowData.DISKONPERIODE === 'ADA') {
                        if (newValue > rowData.SISAKUOTADISKON) {
                            editedQty = rowData.SISAKUOTADISKON;
                            toast.current.show({ severity: 'error', summary: 'Error', detail: `Sisa Kuota Diskon Periode ${rowData.SISAKUOTADISKON} pcs.`, life: 3000 });
                        } else {
                            editedQty = parseFloat(newValue);
                        }
                    } else {
                        editedQty = parseFloat(newValue);
                    }
                    if (editedQty > rowData.SISASTOCKBARANG) {
                        toast.current.show({ severity: 'error', summary: 'Error', detail: `Qty tidak boleh lebih dari Sisa Stock`, life: 3000 });
                        editedQty = parseFloat(1);
                    }
                    if (!isNaN(editedQty)) {
                        // Check if editedQty is a valid number
                        if (editedQty === 0 || editedQty === '') {
                            deleteSelectedRow(rowData);
                        } else {
                            const updatedAddItem = addItem.map((item) => {
                                if (item.BARCODE === rowData.BARCODE) {
                                    const addedData = rowData;
                                    const initialQty = addedData.QTY;
                                    const qtyToAdd = editedQty - initialQty;
                                    const ketAsal = 'editQTYFromTable';

                                    const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, editedQty, undefined, ketAsal);
                                    const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                                    const hargaDisc = funcCalculate.hargaDisc;
                                    const subTotal = funcCalculate.subTotal;

                                    return { ...item, QTY: editedQty, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, HARGADISCQTY: hargaDisc * editedQty };
                                } else {
                                    return item;
                                }
                            });

                            setAddItem(updatedAddItem);

                            // Call a function in index.js to handle the updated addItem
                            if (onQtyUpdate) {
                                onQtyUpdate(updatedAddItem);
                            }
                        }
                    } else {
                        // Handle the case when newValue is not a valid number
                        console.error('Invalid input. Please enter a valid number for QTY.');
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.error('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            case 'DISCOUNT':
                if (!isNaN(newValue)) {
                    // const editedDisc = parseInt(newValue);
                    let editedDisc = parseFloat(newValue);

                    if (editedDisc < 0 || editedDisc > 100) {
                        toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Disc Tidak Boleh Lebih dari 100%', life: 3000 });
                        return;
                    }

                    const updatedAddItem = addItem.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editDiscFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, editedDisc, ketAsal);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;

                            return { ...item, DISCOUNT: editedDisc, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, HARGADISCQTY: hargaDisc * qtyToAdd };
                        } else {
                            return item;
                        }
                    });

                    setAddItem(updatedAddItem);

                    // Call a function in index.js to handle the updated addItem
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddItem);
                    }
                } else {
                    // Handle the case when newValue is not a valid integer
                    console.error('Invalid input. Please enter a valid integer for DISCOUNT.');
                }
                break;
            default:
                break;
        }
    };

    const textEditor = (options) => {
        return <InputText type="number" step="any" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const deleteSelectedRow = (rowData) => {
        const updatedAddItem = addItem.filter((row) => row !== rowData);
        setAddItem(updatedAddItem);
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };

    const totQty = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.QTY), 0);
    const totSubTotal = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.SUBTOTAL), 0);
    const totDiscount = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.HARGADISCQTY), 0);
    const totPpn = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.HARGAPPN), 0);
    const totGrandTotal = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.GRANDTOTAL), 0);
    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totQty.toFixed(2)} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={2} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totSubTotal)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totDiscount)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totPpn)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totGrandTotal)}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={2} />
            </Row>
        </ColumnGroup>
    );

    const [paymentDialog, setPaymentDialog] = useState(false);
    const [ppn, setPpn] = useState(0);
    const [isDisabled, setIsDisabled] = useState(false);
    const btnPayment = () => {
        // setPaymentDialog(true);
        console.log('addItemnya', addItem);
        if (addItem && addItem.length > 0) {
            // Periksa apakah ada item dengan BKP bernilai "1"
            const hasBKP1 = addItem.some((item) => item.BKP === '1');

            // Set state disabled berdasarkan hasil pemeriksaan
            setPaymentDialog(true);
            setIsDisabled(hasBKP1);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Daftar Belanja Masih Kosong!', life: 3000 });
        }
    };
    const promoTemplate = (rowData) => {
        if (rowData.DISKONPERIODE === 'ADA') {
            return <span style={{ border: '1px solid green', color: 'green', padding: '2px 4px' }}>Promo</span>;
        }
        return null;
    };

    return (
        <div>
            <div className="grid formgrid">
                <Toast ref={toast} />
                <div className="field col-12 mb-2 lg:col-12">
                    <div className="grid formgrid">
                        <div className="field col-12 mb-2 lg:col-9">
                            <div className="card">
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        {/* <div className={styles.datatableContainer}> */}
                                        <DataTable
                                            value={addItem}
                                            lazy
                                            className="datatable-responsive"
                                            first={lazyState.first}
                                            totalRecords={totalRecords}
                                            onPage={onPage}
                                            loading={loading}
                                            footerColumnGroup={footerGroup}
                                            size="small"
                                            editMode="cell"
                                            responsiveLayout="scroll"
                                            scrollable
                                            scrollHeight="350px"
                                            frozenFooter
                                        // ={true}
                                        >
                                            <Column headerStyle={{ textAlign: 'center' }} body={promoTemplate} />
                                            <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="BARCODE"></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA BARANG"></Column>

                                            <Column
                                                headerStyle={{ textAlign: 'center' }}
                                                field="QTY"
                                                header="QTY"
                                                body={(rowData) => {
                                                    const qtyValue = parseFloat(rowData.QTY);
                                                    return Number.isInteger(qtyValue) ? qtyValue.toFixed(2) : qtyValue;
                                                }}
                                                editor={(options) => textEditor(options)}
                                                onCellEditComplete={onCellEditComplete}
                                                bodyStyle={{ textAlign: 'center' }}
                                            ></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN" bodyStyle={{ textAlign: 'center' }}></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="HJ" header="HARGA" body={(rowData) => formatRibuan(rowData.HJ)} bodyStyle={{ textAlign: 'right' }}></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="SUBTOTAL" header="SUBTOTAL" body={(rowData) => formatRibuan(rowData.SUBTOTAL)} bodyStyle={{ textAlign: 'right' }}></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT" header="DISC%" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete} bodyStyle={{ textAlign: 'center' }}></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="HARGADISCQTY" header="DISCOUNT" body={(rowData) => formatRibuan(rowData.HARGADISCQTY)} bodyStyle={{ textAlign: 'right' }}></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="HARGAPPN" header="PPN" body={(rowData) => formatRibuan(rowData.HARGAPPN)} bodyStyle={{ textAlign: 'right' }}></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="GRANDTOTAL" header="GRANDTOTAL" body={(rowData) => formatRibuan(rowData.GRANDTOTAL)} bodyStyle={{ textAlign: 'right' }}></Column>
                                            <Column
                                                headerStyle={{ textAlign: 'center' }}
                                                field="SISASTOCKBARANG"
                                                header="SISA STOCK"
                                                body={(rowData) =>
                                                    rowData.SISASTOCKBARANG === 'Unlimited' ? (
                                                        <span style={{ fontSize: '2em' }}>∞</span> // Adjust the size as needed
                                                    ) : (
                                                        formatRibuan(rowData.SISASTOCKBARANG)
                                                    )
                                                }
                                                bodyStyle={{ textAlign: 'right' }}
                                            ></Column>

                                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                                        </DataTable>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* ------------------------------------------------------------------------------------------------------------- */}
                        <div className="field col-12 mb-2 lg:col-3">
                            <div className="col-12 lg:col-12 xl:col-12">
                                <div className="card mb-2">
                                    <div className="formgrid grid">
                                        <div className="field col-12 lg:col-12">
                                            <h6>
                                                <strong>TOTAL</strong>
                                            </h6>
                                            <hr></hr>
                                            {/* <h3 style={{ textAlign: "right" }}>Rp. {formatRibuan(totGrandTotal)}</h3> */}
                                            <InputText className="w-full mt-2" readOnly value={`Rp. ${formatRibuan(totGrandTotal)}`} style={{ fontSize: '16px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold' }} />
                                        </div>
                                    </div>
                                    <div className="my-2 text-right">
                                        <div className="field col-12 mb-2 lg:col-12">
                                            <Button label="Bayar" className="p-button-primary p-button-lg w-full" onClick={btnPayment} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* <div className="col-12 lg:col-12 xl:col-12">
                                    <div className="card mb-0">
                                        <div className="my-2 text-right">
                                            <div className="field col-12 mb-2 lg:col-12">
                                                <Button label="Bayar" className="p-button-primary p-button-lg w-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div> */}
                        </div>
                    </div>
                </div>
            </div>
            <Payment
                isDisabled={isDisabled}
                setIsDisabled={setIsDisabled}
                selectedSesi={selectedSesi}
                dataShift={dataShift}
                addItem={addItem}
                setAddItem={setAddItem}
                paymentDialog={paymentDialog}
                setPaymentDialog={setPaymentDialog}
                totGrandTotal={totGrandTotal}
                totQty={totQty}
                totSubTotal={totSubTotal}
                totDiscount={totDiscount}
                ppn={ppn}
                isChecked={isChecked}
            />
        </div>
    );
}

export default DataBarangTabel;
