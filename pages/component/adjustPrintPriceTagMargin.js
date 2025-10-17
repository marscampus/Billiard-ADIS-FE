import axios from 'axios';
import getConfig from 'next/config';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TabView, TabPanel } from 'primereact/tabview';
import { Skeleton } from 'primereact/skeleton';
import TabelSkaleton from '../../component/tabel/skaleton';
import { Paginator } from 'primereact/paginator';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import postData from '../../lib/Axios';

export default function AdjustPrintPriceTagMargin({ adjustDialog, setAdjustDialog, handleAdjust }) {
    // --------------------------------------------------------------------------------------------------- Export
    const [dataAdjust, setDataAdjust] = useState({ paperWidth: 210 });

    const onInputChange = (e, name) => {
        // const val = (e.target && e.target.value) || "";
        const val = e.value || 0;
        let _dataAdjust = { ...dataAdjust };
        _dataAdjust[name] = val;
        setDataAdjust(_dataAdjust);
        // console.log(status); // This will show the current value of status
    };
    const marginConfig = async () => {
        console.log(dataAdjust);
        handleAdjust(dataAdjust);
        setAdjustDialog(false);
    };

    const footernya = () => {
        return (
            <React.Fragment>
                <div className="flex flex-row md:justify-between md:align-items-center">
                    <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
                        <Button label="Cetak" icon="pi pi-file" className="p-button-danger mr-2" onClick={marginConfig} />
                    </div>
                </div>
            </React.Fragment>
        );
    };
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <Dialog visible={adjustDialog} onHide={() => setAdjustDialog(false)} header="Adjust Print Margin" style={{ width: '70%' }}>
                    <div>
                        <div class="grid">
                            <div class="col-12 md:col-12 lg:col-12">
                                <div className="card">
                                    <div class="grid">
                                        <div class="col-12 md:col-12 lg:col-12">
                                            <label htmlFor="rekening">Lebar Kertas</label>
                                            <div className="p-inputgroup" style={{ marginTop: '5px' }}>
                                                <InputNumber id="paperWidth" value={dataAdjust?.paperWidth} onChange={(e) => onInputChange(e, 'paperWidth')} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Toolbar className="mb-4" right={footernya}></Toolbar>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}
