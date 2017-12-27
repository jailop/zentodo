package main

import (
    "fmt"
    "net/http"
    "time"
    "encoding/json"
    "io/ioutil"
    "strings"
)

type key map[string]int64

var keys []key

func keysCreate() key {
    var k key
    k = make(key)
    k["id"] = time.Now().Unix()
    k["used"] = 0
    keys = append(keys, k)
    res, _ := json.Marshal(keys)
    ioutil.WriteFile("keys.json", []byte(res), 0644)
    return k
}

func newHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == "GET" {
        key := keysCreate()
        res, _ := json.Marshal(key["id"])
        fmt.Fprintf(w, "%s", res)
    }
}

func keyExtract(path string) string {
    index := strings.LastIndex(path, "/")
    if index > -1 {
        s := []byte(path)
        return string(s[index + 1:])
    } else {
        return ""
    }
}

func keyHandler(w http.ResponseWriter, r *http.Request) {
    key := keyExtract(r.URL.Path)
    if key == "" {
        fmt.Fprintf(w, "error:InvalidKey")
        return
    }
    filename := key + ".json"
    if r.Method == "GET" {
        content, err := ioutil.ReadFile(filename)
        if err == nil {
            fmt.Fprintf(w, "%s", content)
        } else {
            fmt.Fprintf(w, "error:FileNotFound")
        }
    } else {
        if r.ContentLength <= 0 {
            fmt.Fprintf(w, "error:InvalidContent")
            return
        }
        content, _ := ioutil.ReadAll(r.Body)
        ioutil.WriteFile(filename, content, 0644)
        fmt.Fprintf(w, "ok")
        fmt.Println(string(content))
    }
}

func main() {
    content, err := ioutil.ReadFile("keys.json")
    if err == nil {
        fmt.Println(string(content))
        json.Unmarshal(content, &keys)
    }
    http.HandleFunc("/keys/new", newHandler)
    http.HandleFunc("/keys/", keyHandler) 
    http.Handle("/", http.FileServer(http.Dir("static")))
    http.ListenAndServe(":20800", nil)
}
