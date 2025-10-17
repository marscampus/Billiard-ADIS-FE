import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from "../../lib/Axios";

export default function Member({memberDialog, setMemberDialog, btnMember, handleMemberData }) {
    const apiEndPointGetMember = '/api/member/get_forkasir';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingMember, setLoadingMember] = useState(false);
    const [memberTabel, setMemberTabel] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
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
        if (memberDialog && btnMember) {
        toggleMember();
        }
    }, [memberDialog, btnMember, lazyState]);

    const loadLazyData = async () => {
        setLoadingMember(true);
        try {
            const header = {
                "Content-Type": "application/json;charset=UTF-8",
                "X-ENDPOINT": apiEndPointGetMember,
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetMember, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setMemberTabel(json.data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoadingMember(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Member >
    const dropdownValues = [
        { name: "KODE", label: "KODE" },
        { name: "NAMA", label: "NAMA" },
    ];
	const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log("_lazyState[]", _lazyState["filters"]);

            _lazyState["filters"] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState["filters"][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerMember = (
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
    const toggleMember = async (event) => {
        setLoadingMember(true);
        // setMemberDialog(true);
        try {
            const header = {
                "Content-Type": "application/json;charset=UTF-8",
                "X-ENDPOINT": apiEndPointGetMember,
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetMember, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setMemberTabel(json.data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoadingMember(false);
        }
        setLoadingMember(false);
    };
	const onRowSelectMember = (event) => {
		const selectedKode = event.data.KODE;
		const selectedMember = memberTabel.find((member) => member.KODE === selectedKode);
        handleMemberData(selectedMember.KODE, selectedMember.NAMA, selectedMember.ALAMAT);
		setMemberDialog(false);
	};

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Member  */}
                <Dialog visible={memberDialog} header="Member" modal className="p-fluid" onHide={() => setMemberDialog(false)}>
                    <DataTable
                        size="small"
                        value={memberTabel}
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
                        <Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="ALAMAT" header="ALAMAT"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}
