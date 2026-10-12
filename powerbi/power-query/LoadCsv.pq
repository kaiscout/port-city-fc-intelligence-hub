// Power Query reference implementation for the public star schema.
// In Power BI Desktop, set DataRoot to this repository's data/processed folder.
let
    LoadCsv = (FileName as text, ColumnTypes as list) as table =>
        let
            Source = Csv.Document(File.Contents(DataRoot & FileName), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
            Headers = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
            Typed = Table.TransformColumnTypes(Headers, ColumnTypes, "en-US")
        in
            Typed
in
    LoadCsv
