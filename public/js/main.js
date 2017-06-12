/**
 * Must be first loaded!
 *
 * @author tss on 28.11.14.
 */
//=== Grid specific vars:
var catalogColumns = [
    //{id: "id", name: "Ид", field: "_id"},
    {
        id: "quote",
        name: "Цитата",
        field: "quote",
        editor: Slick.Editors.LongText,
        formatter: bigTitleFormatter,
        validator: requiredFieldValidator,
        sortable: true,
        width: 140
    },
    {
        id: "topic",
        name: "Тема",
        field: "topic",
        editor: Slick.Editors.Text,
        validator: requiredFieldValidator,
        sortable: true,
        width: 100
    },
    {id: "source", name: "Источник", field: "source", editor: Slick.Editors.Text, sortable: true, width: 100},
    {id: "note", name: "Заметки", field: "note", editor: Slick.Editors.LongText, sortable: true, width: 60},
    {id: "tags", name: "Тэги", field: "tags", editor: Slick.Editors.Text, sortable: true, width: 60}
];
var catalogItem = {"_id": Catalog.NO_ID, "quote": '', "topic": '', "source": '', "note": '', "tags": ''};

function detailsFormatter(row, cell, value, columnDef, dataContext) {
    var title = "<span onclick='alert(this.title)' title='";
    var resultVal = "";
    for (var p in dataContext) {
        if (catalogItem[p] === undefined) {
            resultVal += p + " : " + dataContext[p] + "\n";
        }
    }

    return title + resultVal + "'>" + resultVal + "</span>";
}

function bigTitleFormatter(row, cell, value, columnDef, dataContext) {
    var title = "<span onclick='alert(this.title)' title='";

    return title + value + "'>" + value + "</span>";
}

function birthDayFormatter(row, cell, value, columnDef, dataContext) {
    if (value) {
        var dateArr = value.split(".");
        var day = dateArr[0];
        var month = dateArr[1];
        var d = new Date();
        d.setHours(0);
        var nowTs = d.getTime();
        d.setDate(day);
        d.setMonth(month - 1);
        var dTs = d.getTime();

        var w = new Date();
        w.setDate(w.getDate() - 7);
        var wTs = w.getTime();
        w.setDate(w.getDate() + 14);
        var fTs = w.getTime();

        var classes = "";
        if (dTs < nowTs && dTs > wTs) {
            classes = "color: red;";
        } else if (dTs >= nowTs && dTs < fTs) {
            classes = "color: green;";
        } else {
            return value;
        }

        return "<b style='" + classes + "'>" + value + "</b>";
    } else {
        return "";
    }
}

/** sort date from week ago and later by day-month
 *  return 1 | 0 | -1
 */
function dateSorter(value1, value2, order) {
    if (value1 == value2) return 0;
    if (!value1) return 1;
    if (!value2) return -1;

    function getMixDate(val) {
        var dateArr = val.split(".");
        var day = dateArr[0];
        if (day.length == 1) day = "0" + day;
        var month = dateArr[1];
        if (month && month.length == 1) month = "0" + month;

        return month + day;
    }

    var mixDate1 = getMixDate(value1);
    var mixDate2 = getMixDate(value2);

    return (parseInt(mixDate1) > parseInt(mixDate2) ? 1 : -1) * order;
}

var catGrid, catDataView; // catalog grid and dataView
var catData = [];

//==Init catalog grid
function initCatalogGrid() {
    var c = { // grid search config
        sortcols: [{sortAsc: 1, sortCol: catalogColumns[2]}],
        search: ""
    };

    var options = {
        enableCellNavigation: true,
        enableColumnReorder: true,
        editable: true,
        enableAddRow: true,
        asyncEditorLoading: true,
        autoEdit: true,
        multiColumnSort: true,
        forceFitColumns: true
    };

    function updateOrCreateCatalog(item) {
        var curRow = catGrid.getActiveCell().row;

        function validateGridRow(theId, aGrid) {
            for (var c = 0; c < aGrid.getColumns().length; c++) {
                var col = aGrid.getColumns()[c];
                if (col.validator) {
                    var val = catDataView.getItemById(theId)[col.field];
                    var vRes = col.validator(val);
                    if (!vRes.valid) {
                        vRes.column = c;
                        return vRes;
                    }
                }
            }

            return {valid: true, msg: null, column: -1};
        }

        var validationRes = validateGridRow(item._id, catGrid);
        if (!validationRes.valid) {
            showInfo(validationRes.msg, true);
            catGrid.flashCell(curRow, validationRes.column, 1000);
            catGrid.setActiveCell(curRow, validationRes.column);
            catGrid.editActiveCell();
            return;
        }
        var isCreate = item._id === Catalog.NO_ID;
        var command = Catalog.CREATE_URL;
        if (isCreate) delete item._id;
        else command = Catalog.UPDATE_URL;
        $.post(command, item,
            function (resp) {
                console.info("New D: ", resp);
                if (isCreate) {
                    catDataView.deleteItem(Catalog.NO_ID);
                    catDataView.addItem(resp);
                } else {
                    catDataView.updateItem(item._id, item);
                }
                showInfo("Сохранено.", false);
            }, "json"
        );
    }

    catDataView = new Slick.Data.DataView({inlineFilters: true});
    catGrid = new Slick.Grid("#catalogGrid", catDataView, catalogColumns, options);
    catGrid.setSelectionModel(new Slick.RowSelectionModel());

    var checkboxSelector = new Slick.CheckboxSelectColumn({
        cssClass: "slick-cell-checkboxsel"
    });
    catalogColumns.unshift(checkboxSelector.getColumnDefinition());
    catGrid.registerPlugin(checkboxSelector);

    var columnpicker = new Slick.Controls.ColumnPicker(catalogColumns, catGrid, options);


    catGrid.onCellChange.subscribe(function (e, args) {
        updateOrCreateCatalog(args.item);
    });

    catGrid.onAddNewRow.subscribe(function (e, args) {
        var aCell = args.grid.getActiveCell();
        //I) Check if previous not saved(has no id)
        var prevItem = catDataView.getItem(aCell.row - 1);
        if (aCell.row != 0 && ( !prevItem || prevItem._id == Catalog.NO_ID )) {
            //catGrid.flashCell(aCell.row - 1, aCell.cell, 500);    //todo: review
            catGrid.setActiveCell(aCell.row - 1, aCell.cell);
            console.info('Previous is not saved!');
            return;
        }
        //II) Validate this value
        var value = "";
        for (var p in args.item) value = args.item[p]//it is always has one property
        if (args.column.validator) {
            var result = args.column.validator(value);
            if (!result.valid) {
                catGrid.flashCell(aCell.row, aCell.cell, 500);
                console.info('Not Valid!');
                return;
            }
        }
        var defObject = $.extend({}, catalogItem);
        $.extend(defObject, args.item);
        console.info("Adding item:", defObject);
        catDataView.addItem(defObject);
        updateOrCreateCatalog(defObject);
        $("#pager").html("Total: " + catData.length);
    });

    catGrid.onKeyDown.subscribe(function (e) {
        if (e.which != 65 || !e.ctrlKey) {// select all rows on ctrl-a
            return false;
        }
        var rows = [];
        for (var i = 0; i < catDataView.getLength(); i++) {
            rows.push(i);
        }

        catGrid.setSelectedRows(rows);
        e.preventDefault();
    });

    function comparer(a, b) {
        var cols = c.sortcols;
        for (var i = 0, l = cols.length; i < l; i++) {
            var field = cols[i].sortCol.field;
            var sorter = cols[i].sortCol.sorter;
            var sign = cols[i].sortAsc ? 1 : -1;
            var value1 = a[field], value2 = b[field];
            var result;
            if (sorter) {
                result = sorter(value1, value2, sign);
            } else {
                result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
            }
            if (result != 0) {
                return result;
            }
        }
        return 0;
    }

    catGrid.onSort.subscribe(function (e, args) {
        c.sortcols = args.sortCols;

        if ($.browser.msie && $.browser.version <= 8) {
            catDataView.fastSort(c.sortcols, args.sortAsc);
        } else {
            catDataView.sort(comparer, args.sortAsc);
        }
    });

    // wire up model events to drive the grid
    catDataView.onRowCountChanged.subscribe(function (e, args) {
        catGrid.updateRowCount();
        catGrid.render();
    });

    catDataView.onRowsChanged.subscribe(function (e, args) {
        catGrid.invalidateRows(args.rows);
        catGrid.render();
    });

    // wire up the search textbox to apply the filter to the model
    $("#txtSearch5").keyup(function (e) {
        Slick.GlobalEditorLock.cancelCurrentEdit();
        if (e.which == 27) { // clear on Esc
            this.value = "";
        }

        c.search = this.value;
        updateFilter();
    });
    $("#txtSearch5").val("").focus();

    function updateFilter() {
        catDataView.setFilterArgs({
            search: c.search
        });
        catDataView.refresh();
    }

    // initialize the model after all the events have been hooked up
    catDataView.beginUpdate();
    catDataView.setItems(catData, Catalog.ID_NAME);
    catGrid.setColumns(catalogColumns);

    catDataView.setFilterArgs({
        search: c.search
    });

    function catalogFilter(item, args) {
        var s = args.search.toLowerCase();
        var isContains = false;
        for (var i = 0; i < catGrid.getColumns().length; i++) {
            var val = item[catGrid.getColumns()[i].id];
            val = val ? $.trim(val.toString().toLowerCase()) : "";
            isContains = (val.indexOf(s) > -1);
            if (isContains) break;
        }

        if (s != "" && !isContains) {
            return false;  // do not show
        }
        return true;
    }

    catDataView.setFilter(catalogFilter);
    catDataView.endUpdate();
}

function requiredFieldValidator(value) {
    if (value == null || value == undefined || value === "") {
        return {valid: false, msg: "Значение обязательно!"};
    } else {
        return {valid: true, msg: null};
    }
}

/*
 * Main start function.
 */

(function () {
    function voidMain() {
        // init data table
        $.getJSON("./read", {}, function (data) {
            catData = data;
            initCatalogGrid();
            $("#pager").html("Total: " + catData.length);
            // default sorting
            $('.slick-header-columns').children().eq(3).trigger('click');
        });

        // init UI
        $('#tabs').tabs();
        $('legend').click(function () { // expand/collapse
            $(this).parent().find('div:first').toggle();
        });
        $('#importArea').change(function () {
            if ($(this).val()) {
                var obj = "";
                try {
                    obj = $.parseJSON($(this).val())[0];
                } catch (e) {
                    showInfo(e.message, true);
                }
                $('#importColumns').html("( " + Object.keys(obj).toString() + " )");
            }
        });

        var mappingHtm = "";
        for (var i = 0; i < catalogColumns.length; i++) {
            var colName = catalogColumns[i].id;
            mappingHtm += "<div><label>" + colName + "</label><input type='text' name='" + colName + "'/></div>";
        }
        $("#columnsMapping").html(mappingHtm);
    }

    voidMain();
})();
