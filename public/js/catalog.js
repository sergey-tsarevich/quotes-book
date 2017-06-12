/**
 * Main catalog logic
 * @author tss on 22.11.14.
 */

var Catalog = {
    ID_NAME: "_id",
    NO_ID: "-",
    CREATE_URL: ADMIN_URL + "/create",
    UPDATE_URL: ADMIN_URL + "/update",
    DELETE_URL: ADMIN_URL + "/delete",
    READ_URL: "read",
    it: this,
    addC: function () {
        catGrid.scrollRowToTop(catGrid.getDataLength());
        catGrid.setActiveCell(catGrid.getDataLength(), 1);
        catGrid.editActiveCell();
        return false;
    },
    delSelectedC: function () {
        if (!confirm("Вы уверены, что хотите удалить выбранную запись?")) return false;
        var isBreak = false;
        var ids = [], currId, c;
        for (c = 0; c < catGrid.getSelectedRows().length; c++) {
            var curRow = catGrid.getSelectedRows()[c];
            var item = catGrid.getDataItem(curRow);
            if (item._id == Catalog.NO_ID) {
                catDataView.deleteItem(Catalog.NO_ID);
                //catGrid.setSelectedRows([]);
                return;
            } else {
                ids[ids.length] = item._id;
            }
        }
        catGrid.setSelectedRows([]);
        for (c = 0; c < ids.length; c++) { // todo: make bath deletion!
            currId = ids[c];
            $.ajax({
                async: false, type: 'POST', url: this.DELETE_URL,
                data: {_id: currId},
                success: function (r) {
                    if ("Ok" == r._id) {
                        showInfo("Удалено!", false);
                        catDataView.deleteItem(currId);
                        isBreak = false;
                        $("#pager").html("Total: " + catData.length);
                    } else {
                        showInfo(r.err, true);
                        isBreak = true;
                    }
                }
            });
            if (isBreak) break;
        }

        return false;
    },
    importData: function () {
        var importedTxt = $("#importArea").val();
        var rows = $.parseJSON( importedTxt );
        var realCount;
        var tags = $("#tags").val();
        var mapObj = {};
        var mappingExists = false;
        $("#columnsMapping input").each(function( index ) {
            var mappedProp = $( this ).val();
           if (mappedProp) {
               var propInDB = $(this).attr("name");
               mapObj[propInDB] = mappedProp;
               mappingExists = true;
           }
        });

        for (var c = 0; c < rows.length; c++) {
            var obj = rows[c];
            obj["tags"] = tags;
            if (mappingExists) {
                for(var propInDB in mapObj) {
                    var mappedProp = mapObj[propInDB];
                    obj[propInDB] = obj[mappedProp];
                    delete obj[mappedProp];
                }
            }
            $.post(this.CREATE_URL, obj,
                function (resp) {
                    console.info("Imported: ", resp);
                    if (resp && resp._id) realCount++;
                }, "json"
            );
        }

        showInfo("Импортировано " + realCount + " документов.", false);
        catGrid.setSelectedRows([]);
        // reload data
        $.getJSON(this.READ_URL, {}, function (data) {
            catData = data;
            catDataView.setItems(catData, "_id");
            catDataView.refresh();
            $("#pager").html("Total: " + catData.length);
        });

        return false;
    }
};

var Util = {
    notificationTimeOut: null, // todo: review me!
    resizeTimer: null // todo: review me!
};

function showInfo(mess, isError) {
    cleanInfo();
    $('#infoDiv').html(
        "<b style='color:" + (isError ? "red" : "green") + ";'>" + (mess.statusText ? mess.statusText : mess) + "</b>");
    setTimeout(function () {
        $('#infoDiv').html('');
    }, 10000);
}

function cleanInfo() {
    if (Util.notificationTimeOut) {
        clearTimeout(Util.notificationTimeOut);
        Util.notificationTimeOut = null;
        $('#infoDiv').html("");
    }
}

$.ajaxSetup({
    error: function (result) {
        showInfo(result, true);
    },
    beforeSend: function () {
        if (!Util.notificationTimeOut)
            Util.notificationTimeOut = setTimeout(
                function () {
                    $('#infoDiv').html("<b style='color:#c77405;'>Ожидание ответа от сервера.</b>");
                }, 1000);
    },
    complete: cleanInfo
});
