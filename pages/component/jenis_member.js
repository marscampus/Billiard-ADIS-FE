import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

export default function Member({ memberDialog, setMemberDialog, btnMember, handleMemberData }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetMember = '/api/jenis_member/get';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingMember, setLoadingMember] = useState(false);
    const [memberTabel, setMemberTabel] = useState(null);
    const [memberTabelFilt, setMemberTabelFilt] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [search, setSearch] = useState('');
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

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    useEffect(() => {
        setMemberTabelFilt(memberTabel);
    }, [memberTabel, lazyState]);

    useEffect(() => {
        if (memberDialog && btnMember) {
            toggleMember();
        }
    }, [memberDialog, btnMember, lazyState]);

    const loadLazyData = async () => {
        setLoadingMember(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetMember
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetMember, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setMemberTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingMember(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Member >
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

    const headerMember = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" /> */}
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = memberTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KETERANGAN) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = memberTabel;
            } else {
                filtered = memberTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setMemberTabelFilt(filtered);
    };

    const toggleMember = async (event) => {
        setLoadingMember(true);
        // setMemberDialog(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetMember
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetMember, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setMemberTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingMember(false);
        }
        setLoadingMember(false);
    };

    const onRowSelectMember = (event) => {
        const selectedKode = event.data.KODE;
        const selectedMember = memberTabel.find((member) => member.KODE === selectedKode);
        handleMemberData(selectedMember.KODE, selectedMember.KETERANGAN, selectedMember.ALAMAT);
        setMemberDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Member  */}
                <Dialog visible={memberDialog} header="Member" modal className="p-fluid" onHide={() => setMemberDialog(false)}>
                    <DataTable
                        size="small"
                        value={memberTabelFilt}
                        lazy
                        dataKey="KODE"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loadingMember}
                        header={headerMember}
                        onRowSelect={onRowSelectMember}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}
