import fs from 'node:fs';
const file = 'src/pages/Call/CallLogs.tsx'; let content = fs.readFileSync(file, 'utf8');
content = content.replace('  Table,\n', '').replace('  Table,\r\n', '');
content = "import ListingTable from 'src/components/shared/listing/ListingTable';\nimport { LISTING_FIELDS } from 'src/components/shared/listing/listing-presets';\n" + content;
content = content.replace("  const [calls, setCalls]", "  const [listingSearch, setListingSearch] = useState('');\n  const [listingFilters, setListingFilters] = useState<Record<string, string>>({});\n  const [calls, setCalls]");
content = content.replace('  useEffect(() => {\n    const query: any = {', '  useEffect(() => {\n    let active = true;\n    const query: any = {').replace('  useEffect(() => {\r\n    const query: any = {', '  useEffect(() => {\n    let active = true;\n    const query: any = {');
content = content.replace('    setLoading(true);', "    if (listingSearch) query.callSid = listingSearch.trim();\n    if (listingFilters.status) query.status = listingFilters.status;\n    setLoading(true);");
content = content.replace('if (res?.data?.success) {', 'if (active && res?.data?.success) {');
content = content.replace('.catch(console.error)\n      .finally(() => setLoading(false));\n  }, [isRecordingPage, tableLimit, tablePage]);', ".catch(console.error)\n      .finally(() => { if (active) setLoading(false); });\n    return () => { active = false; };\n  }, [isRecordingPage, tableLimit, tablePage, searchParams, listingSearch, listingFilters]);").replace('.catch(console.error)\r\n      .finally(() => setLoading(false));\r\n  }, [isRecordingPage, tableLimit, tablePage]);', ".catch(console.error)\n      .finally(() => { if (active) setLoading(false); });\n    return () => { active = false; };\n  }, [isRecordingPage, tableLimit, tablePage, searchParams, listingSearch, listingFilters]);");
content = content.replace('        <Table', `        <ListingTable listingTitle={isRecordingPage ? 'Recordings' : 'Call Logs'} fields={LISTING_FIELDS.calls} filterKeys={['status']} serverSide searchPlaceholder="Search exact Call SID" onFiltersChange={(search, filters) => { setListingSearch(search); setListingFilters(filters); setTablePage(1); }} loadExportRows={async () => {
          const rows: Call[] = [];
          let page = 1;
          while (true) {
            const query = { ...Object.fromEntries(searchParams), ...(isRecordingPage ? { onlyRecording: true } : {}), ...(listingSearch ? { callSid: listingSearch.trim() } : {}), ...(listingFilters.status ? { status: listingFilters.status } : {}), page, limit: 100 };
            const res = await getCallHistoryApi(query);
            if (!res.data?.success) throw new Error('Unable to load call records for export');
            const batch: Call[] = res.data.data.calls ?? [];
            rows.push(...batch);
            const totalPages = res.data.data.pagination?.pages;
            if ((totalPages != null && page >= totalPages) || !batch.length || (totalPages == null && batch.length < 100)) break;
            page += 1;
          }
          return rows;
        }}`);
fs.writeFileSync(file, content);
