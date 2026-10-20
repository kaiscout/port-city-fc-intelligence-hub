# Power BI companion

Open `PortCityFCCompanion/PortCityFCCompanion.pbip` in Power BI Desktop. Set the `DataRoot`
Power Query parameter to the absolute path of `data/processed` (including the trailing
path separator), then refresh.

The project contains a source-controlled PBIR report, TMDL semantic model, Power Query
parameterized CSV imports, DAX measures, one-to-many star-schema relationships and two
program RLS roles. All loaded data is synthetic. Power BI Desktop is required for the
final native render; this repository's CI validates the generated file structure and JSON.

Source reference: 2026-10-12. Candidate prepared 2026-10-18. Finance facts contain
FY25 monthly synthetic cash only; FY24 annual totals are in the web hub/workbook,
not manufactured into monthly facts. Net Cash means inflow minus outflow, never a
bank balance, profit or runway. Category and operating facts use 31 December as a
period anchor for annual assumptions, not the date of a transaction or fixture.
The Annual Category Amount measure deliberately removes month/date context while
retaining the DimDate Year filter. It never represents December-only or monthly
spend. Club/program security filters are not removed. See Microsoft's
[ALLEXCEPT definition](https://learn.microsoft.com/en-us/dax/allexcept-function-dax).

Operating attendance and price measures use SELECTEDVALUE: conflicting assumptions
return blank instead of selecting a flattering maximum. These are planning inputs,
not averages calculated from actual fixtures. RLS includes CLUB plus one program;
club-wide finance is visible and unallocated in each role, and must not be summed
across role views. Configure service identity-to-role membership before publication.
No private application records or organization authorization is supplied by this model.
Native Desktop refresh, visual rendering and View As role testing remain required
on the recipient's Power BI Desktop installation; source validation is not a native test.
