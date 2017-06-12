/**
 * @author tss on 29.11.14.
 */

var DbUtils= {
    compactDB: function () {
        $.post(ADMIN_URL + "/db/compact", {},
            function (resp) {
                showInfo(resp.code, false);
            }, "json"
        );
    }
}
