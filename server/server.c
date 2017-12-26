#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <microhttpd.h>

#define PORT 8888
#define PAGE "<html><body>Hello, world</body></html>"

int print_out_key(
        void *cls,
        enum MHD_ValueKind kind,
        const char *key,
        const char *value
) {
    printf("%s: %s\n", key, value);
    return MHD_YES;
}

int answer_to_connection(
        void *cls, 
        struct MHD_Connection *conn, 
        const char *url, 
        const char *method,
        const char *version, 
        const char *upload, 
        size_t *upload_size, 
        void **con_cls
) {
    int ret;
    struct MHD_Response *response;
    printf("%s %s %s\n", method, url, version);
    MHD_get_connection_values(conn, MHD_HEADER_KIND, &print_out_key, NULL);
    response = MHD_create_response_from_buffer(
            strlen(PAGE),
            (void *) PAGE,
            MHD_RESPMEM_PERSISTENT
    );
    MHD_add_response_header(response, "Content-type", "text/html");
    ret = MHD_queue_response(conn, MHD_HTTP_OK, response);
    MHD_destroy_response(response);
    return ret;
}

int main() {
    struct MHD_Daemon *daemon;
    daemon = MHD_start_daemon(
            MHD_USE_SELECT_INTERNALLY,
            PORT,
            NULL,
            NULL, 
            &answer_to_connection,
            NULL,
            MHD_OPTION_END
    );
    if (!daemon) return 1;
    getchar();
    MHD_stop_daemon(daemon);
    return 0;
}
