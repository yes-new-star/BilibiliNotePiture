/**
 * @Descripttion: b站获取评论区笔记图片脚本
 * @version: 0.1.0
 * @Author: yes-new-star
 * @Date: 2023-05-29 22:34:03
 * @LastEditors: yes-new-star
 * @LastEditTime: Do not Edit
 */

import https from "https";
import querystring from "querystring";

function bilibili_reply() {
  const myCookie ="";

  let reg = /(?<=bili_jct=)[0-9a-f]{32}/;

  const reply_csrf = myCookie.match(reg)[0];

  const unread_options = {
    method: "GET",
    hostname: "api.bilibili.com",
    path: "/x/msgfeed/unread?build=0&mobi_app=web",
    headers: {
      Cookie: myCookie,
    },
    withCredentials: true,
  };

  const unread_req = https.request(unread_options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      data = JSON.parse(data);
      console.log("unread:", data);
      if (data.data.at > 0) {
        // 获取所有的@信息的请求头
        const at_options = {
          method: "GET",
          hostname: "api.bilibili.com",
          path: "/x/msgfeed/at?build=0&mobi_app=web",
          headers: {
            Cookie: myCookie,
          },
          withCredentials: true,
        };

        let at_nums = data.data.at;

        const req = https.request(at_options, (res) => {
          let data = "";
          console.log("statusCode:", res.statusCode);

          if (res.statusCode == "200") {
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              data = JSON.parse(data);

              for (let i = 0; i < at_nums; i++) {
                const reply_options = {
                  method: "GET",
                  hostname: "api.bilibili.com",
                  path: `/x/v2/reply/main?csrf=${reply_csrf}&mode=3&oid=${
                    data.data.items[at_nums - i - 1].item.subject_id
                  }&pagination_str=%7B%22offset%22:%22%22%7D&plat=1&seek_rpid=${
                    data.data.items[at_nums - i - 1].item.source_id
                  }&type=1`,
                  headers: {
                    Cookie: myCookie,
                  },
                  withCredentials: true,
                };
                const reply_req = https.request(reply_options, (res) => {
                  let reply_data = "";
                  res.on("data", (chunk) => {
                    reply_data += chunk;
                  });
                  res.on("end", () => {
                    reply_data = JSON.parse(reply_data);

                    let add_message = "";

                    for (
                      let j = 0;
                      j <
                      reply_data.data.seek_root_reply.content.pictures.length;
                      j++
                    ) {
                      add_message += `图片${j + 1}地址：${
                        reply_data.data.seek_root_reply.content.pictures[j]
                          .img_src
                      }\n`;
                    }
                    console.log(
                      "Response body:",
                      reply_data.data.seek_root_reply.content.pictures,reply_csrf
                    );
                    // 回复请求
                    const datas = {
                      type: 1,
                      oid: data.data.items[at_nums - i - 1].item.subject_id,

                      message: add_message,
                      root: data.data.items[at_nums - i - 1].item.target_id,
                      parent: data.data.items[at_nums - i - 1].item.source_id,
                      jsonp: 'jsonp',
                      scene: 'msg',
                      plat: 1,
                      from: 'im-reply',
                      build: 0,                      
                      mobi_app: 'web',
                      csrf: reply_csrf,
                      csrf_token: reply_csrf,
                    };
                    const postData = querystring.stringify(datas);
                    const add_options = {
                      method: "POST",
                      hostname: "api.bilibili.com",
                      path: `/x/v2/reply/add`,
                      headers: {
                        Cookie: myCookie,
                        "Content-Type": "application/json;charset=utf-8",
                      },
                      withCredentials: true,
                    };
                    const add_req = https.request(add_options, (res) => {
                      console.log(res.statusCode);
                      let data = "";
                      res.on("data", (chunk) => {
                        data += chunk;
                      });
                      res.on("end", () => {
                        console.log("回复请求结果：", data);
                      });
                    });
                    add_req.on("error", (error) => {
                      console.error("Request error:", error);
                    });
                    add_req.write(postData);
                    console.log('postdata',postData)
                    add_req.end();
                  });
                });
                reply_req.on("error", (error) => {
                  console.error("Request error:", error);
                });
                reply_req.end();
              }
            });
          }
        });
        req.on("error", (error) => {
          console.error("Request error:", error);
        });
        req.end();
      } else {
        console.log("没人艾特我！");
      }
    });
  });
  unread_req.on("error", (error) => {
    console.error("Request error:", error);
  });
  unread_req.end();
}

bilibili_reply();
