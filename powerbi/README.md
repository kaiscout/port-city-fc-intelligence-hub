# Power BI companion

Open `PortCityFCCompanion/PortCityFCCompanion.pbip` in Power BI Desktop. Set the `DataRoot`
Power Query parameter to the absolute path of `data/processed` (including the trailing
path separator), then refresh.

The project contains a source-controlled PBIR report, TMDL semantic model, Power Query
parameterized CSV imports, DAX measures, one-to-many star-schema relationships and two
program RLS roles. All loaded data is synthetic. Power BI Desktop is required for the
final native render; this repository's CI validates the generated file structure and JSON.
