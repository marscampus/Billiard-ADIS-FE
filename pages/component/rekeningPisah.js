import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { TabPanel, TabView } from 'primereact/tabview';
import React, { useEffect, useRef, useState } from 'react';
import TabelSkaleton from '../../component/tabel/skaleton';
import postData from '../../lib/Axios';

export default function Rekening({ rekeningDialog, setRekeningDialog, btnRekening, handleRekeningData }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetRekening = '/api/rekening/get';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [rekeningTabel, setRekeningTabel] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {
            kode: 1,
            search: ''
        }
    });

    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field: 'KODE', header: 'KODE' },
        { field: 'KETERANGAN', header: 'KETERANGAN' },
        { field: 'JENISREKENING', header: 'JENISREKENING' }
    ];
    const [rekening1, setRekening1] = useState(null);
    const [rekening2, setRekening2] = useState(null);
    const [rekening3, setRekening3] = useState(null);
    const [rekening4, setRekening4] = useState(null);
    const [rekening5, setRekening5] = useState(null);
    const [rekening6, setRekening6] = useState(null);

    const fields = [
        { field: 'KODE', header: 'KODE' },
        { field: 'KETERANGAN', header: 'KETERANGAN' },
        { field: 'JENISREKENING', header: 'JENISREKENING' }
    ];
    const op = useRef(null);
    const onPage = (event) => {
        onPage(event);
        // setlazyState(event);
    };

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    useEffect(() => {
        if (rekeningDialog && btnRekening) {
            toggleRekening();
        }
    }, [rekeningDialog, btnRekening, lazyState]);

    const loadLazyData = async (id) => {
        setLoading(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetRekening
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetRekening, { id: id });
            const json = vaTable.data;
            console.log('json..', json.data);
            return json.data;
            // setTotalRecords(json.total);
            // setRekeningTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Rekening >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerRekening = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    const toggleDataTable = async (event) => {
        // op.current.toggle(event);
        console.log(event);
        let indeks = null;
        let skipRequest = false;
        switch (event.index) {
            case 1:
                indeks = 2;
                rekening2 !== null ? (skipRequest = true) : '';
                break;
            case 2:
                indeks = 3;
                rekening3 !== null ? (skipRequest = true) : '';
                break;
            case 3:
                indeks = 4;
                rekening4 !== null ? (skipRequest = true) : '';
                break;
            case 4:
                indeks = 5;
                rekening5 !== null ? (skipRequest = true) : '';
                break;
            case 5:
                indeks = 6;
                rekening6 !== null ? (skipRequest = true) : '';
                break;

            default:
                indeks = 1;
                rekening1 !== null ? (skipRequest = true) : '';
                break;
        }

        setRekeningDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoading(true);
        if (skipRequest === false) {
            const resRekening = await toggleRekening(indeks);
            console.log('resRekening', resRekening);
            updateStateRekening(indeks, resRekening.data);
        }
        setLoading(false);
    };

    const updateStateRekening = (indeks, data) => {
        console.log(data);
        switch (indeks) {
            case 2:
                setRekening2(data);
                break;
            case 3:
                setRekening3(data);
                break;
            case 4:
                setRekening4(data);
                break;
            case 5:
                setRekening5(data);
                break;
            case 6:
                setRekening6(data);
                break;

            default:
                setRekening1(data);
                break;
        }
    };
    // const toggleDataTable = async (event) => {
    //     setActiveIndex(event.index);
    //     let _lazyState = { ...lazyState };
    //     _lazyState['filters']['kode'] = event.index + 1;
    //     setlazyState(_lazyState);
    // };
    const toggleRekening = async (event) => {
        setLoading(true);
        // setRekeningDialog(true);
        try {
            const vaTable = await postData(apiEndPointGetRekening, lazyState);
            const json = vaTable.data;
            return json;
            setTotalRecords(json.total);
            setRekeningTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };
    const onRowSelect = (event) => {
        const selectedKode = event.data;
        // return console.log('selectedKode',selectedKode);
        handleRekeningData(selectedKode.KODE, selectedKode.KETERANGAN);
        setRekeningDialog(false);
    };
    const bodyJenisRekening = (rowData) => {
        return <span>{rowData.JENISREKENING == 'I' ? 'INDUK' : 'DETAIL'}</span>;
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Rekening  */}
                <Dialog visible={rekeningDialog} style={{ width: '75%' }} header="Rekening" modal className="p-fluid" onHide={() => setRekeningDialog(false)}>
                    {/* <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        <TabPanel header="ASET">
                            <TabelData
                                onValue={rekening1}
                                onLoading={loading}
                                onTotalRecords={totalRecords}
                                onLazyState={lazyState}
                                onColumn={fields}
                                onPages={(onpage) => {
                                    setlazyState(onpage);
                                }}
                                // onPage={onPage}
                                handleRekeningData={handleRekeningData}
                                setRekeningDialog={setRekeningDialog}
                            ></TabelData>
                        </TabPanel>
                        <TabPanel header="KEWAJIBAN">
                            <TabelData
                                onValue={rekening2}
                                onLoading={loading}
                                onTotalRecords={totalRecords}
                                onLazyState={lazyState}
                                onColumn={fields}
                                onPages={(onpage) => {
                                    setlazyState(onpage);
                                }}
                                handleRekeningData={handleRekeningData}
                                setRekeningDialog={setRekeningDialog}
                            ></TabelData>
                        </TabPanel>
                        <TabPanel header="MODAL">
                            <TabelData
                                onValue={rekening3}
                                onLoading={loading}
                                onTotalRecords={totalRecords}
                                onLazyState={lazyState}
                                onColumn={fields}
                                onPages={(onpage) => {
                                    setlazyState(onpage);
                                }}
                                handleRekeningData={handleRekeningData}
                                setRekeningDialog={setRekeningDialog}
                            ></TabelData>
                        </TabPanel>
                        <TabPanel header="PENDAPATAN">
                            <TabelData
                                onValue={rekening4}
                                onLoading={loading}
                                onTotalRecords={totalRecords}
                                onLazyState={lazyState}
                                onColumn={fields}
                                onPages={(onpage) => {
                                    setlazyState(onpage);
                                }}
                                handleRekeningData={handleRekeningData}
                                setRekeningDialog={setRekeningDialog}
                            ></TabelData>
                        </TabPanel>
                        <TabPanel header="BIAYA">
                            <TabelData
                                onValue={rekening5}
                                onLoading={loading}
                                onTotalRecords={totalRecords}
                                onLazyState={lazyState}
                                onColumn={fields}
                                onPages={(onpage) => {
                                    setlazyState(onpage);
                                }}
                                handleRekeningData={handleRekeningData}
                                setRekeningDialog={setRekeningDialog}
                            ></TabelData>
                        </TabPanel>
                        <TabPanel header="ADMINISTRATIF">
                            <TabelData
                                onValue={rekening6}
                                onLoading={loading}
                                onTotalRecords={totalRecords}
                                onLazyState={lazyState}
                                onColumn={fields}
                                onPages={(onpage) => {
                                    setlazyState(onpage);
                                }}
                                handleRekeningData={handleRekeningData}
                                setRekeningDialog={setRekeningDialog}
                            ></TabelData>
                        </TabPanel>
                    </TabView> */}
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        <TabPanel header="ASET">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable value={rekening1} onRowSelect={onRowSelect} selectionMode="single" size="small">
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="JENISREKENING" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="KEWAJIBAN">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable value={rekening2} onRowSelect={onRowSelect} selectionMode="single" size="small">
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="JENISREKENING" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="MODAL">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable value={rekening3} onRowSelect={onRowSelect} selectionMode="single" size="small">
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="JENISREKENING" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="PENDAPATAN">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable value={rekening4} onRowSelect={onRowSelect} selectionMode="single" size="small">
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="JENISREKENING" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="BIAYA">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable value={rekening5} onRowSelect={onRowSelect} selectionMode="single" size="small">
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="JENISREKENING" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                        <TabPanel header="ADMINISTRATIF">
                            {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loading && (
                                <DataTable value={rekening6} onRowSelect={onRowSelect} selectionMode="single" size="small">
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN" />
                                    <Column headerStyle={{ textAlign: 'center' }} field="JENISREKENING" header="JENISREKENING" body={bodyJenisRekening} />
                                </DataTable>
                            )}
                        </TabPanel>
                    </TabView>
                </Dialog>
            </div>
        </div>
    );
}
