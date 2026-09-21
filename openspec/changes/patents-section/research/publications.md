# 調査結果（2026-09-21 時点）

Google Patents の発明者検索で取得できた公報の一覧。**同族は未解決**で、JP の公報番号と出願国の全体像は含まない。

取得日 2026-09-21。出所は `https://patents.google.com/xhr/query?url=q%3Din%3A"<名前>"%26num%3D100`。

## 取得できなかったもの

- **ローマ字表記 `Josuke Yamane` の全件**。日本語表記の 6 クエリ目あたりから Google が自動クエリと判断してこの egress を `503`（`Sorry...` ページ）で遮断し、curl・WebFetch とも通らなくなった。15 分間隔 × 6 回の再試行でも回復せず、PO の決定（2026-09-21）で後日に回した。
- **各公報の同族（Worldwide applications）・優先日・日本語の発明の名称**。公報ページの取得が同じ遮断に当たった。

この 2 つが取れるまで、`countries` は「確認できた出願国」だけを持つ。結果として並び順は実質 `filedAt` の降順になる（spec の要求は変わらない。国数がすべて 1 なので第 2 基準に落ちるだけ）。

## 表 A: 日本語表記「山根丈亮」でヒットした全件（51 件）

検索 API の `total_num_results` は 52 だが、`TWI923233B` が英語タイトルと中国語タイトルで 2 回返るため実体は 51 件。出願人はすべてトヨタ自動車株式会社（No.1 のみトヨタ自動車 + 学校法人トヨタ学園）。PO は 2026-09-21 にこの 51 件すべてが自身の発明であることを確認済み。

| # | 公報番号 | 発明の名称（Google Patents の英語表記） | 出願日 |
|---|---|---|---|
| 1 | JP6549500B2 | Topic estimation learning apparatus and topic estimation learning method | 2016-02-26 |
| 2 | JP7151181B2 | 音声対話システム、その処理方法及びプログラム | 2018-05-31 |
| 3 | CN111238513B | Information providing system, server, vehicle-mounted device, and information method | 2019-10-18 |
| 4 | CN111238491A | Information providing system, server, vehicle-mounted device, and information method | 2019-10-29 |
| 5 | CN111243314A | Information providing system, server, mobile terminal, non-transitory storage medium | 2019-11-04 |
| 6 | CN111246160A | Information providing system and method, server, vehicle-mounted device | 2019-11-14 |
| 7 | CN111243332A | Information providing system and method, server, in-vehicle device, and storage medium | 2019-11-18 |
| 8 | CN111301284B | In-vehicle device, program, and vehicle | 2019-11-20 |
| 9 | CN111311919A | Server, in-vehicle device, program, information providing system, method | 2019-11-22 |
| 10 | CN111301285A | Control system, server, vehicle-mounted control device, vehicle, and control method | 2019-12-04 |
| 11 | CN111422128A | Server, in-vehicle device, vehicle, storage medium, and information providing method | 2020-01-02 |
| 12 | CN113140119A | Information processing apparatus, information processing method, and computer medium | 2021-01-11 |
| 13 | CN113135091B | Information processing device, recording medium, and information processing method | 2021-01-13 |
| 14 | CN113492768B | Information processing apparatus, information processing system, computer-readable recording medium | 2021-01-14 |
| 15 | CN113256364A | Information processing apparatus, information processing method, and non-transitory medium | 2021-01-21 |
| 16 | CN113160552A | Information processing apparatus, information processing method, and computer medium | 2021-01-22 |
| 17 | CN113344312A | Information processing apparatus, information processing method, and computer medium | 2021-02-02 |
| 18 | CN113269988B | Information processing device, information processing method, and recording medium | 2021-02-08 |
| 19 | CN113538174A | Information processing apparatus, information processing system, program | 2021-03-02 |
| 20 | CN113395316B | Information processing device and information processing system | 2021-03-09 |
| 21 | CN113411776A | Information processing device, vehicle system, information processing method | 2021-03-11 |
| 22 | CN113401074B | Information processing device, information processing method, and non-transitory storage medium | 2021-03-15 |
| 23 | CN113401129B | Information processing device, recording medium, and information processing method | 2021-03-16 |
| 24 | CN113453193B | Information processing devices and recording media | 2021-03-22 |
| 25 | CN113553496B | Information processing device, information processing method and non-transitory medium | 2021-04-01 |
| 26 | CN113743976A | Information processing device, information processing system, program | 2021-04-07 |
| 27 | CN113744090A | Information processing device, information processing system, program | 2021-04-07 |
| 28 | CN113497750B | Information processing apparatus, information processing system, and non-transitory medium | 2021-04-07 |
| 29 | CN113587939A | Information processing apparatus, information processing system, program | 2021-04-13 |
| 30 | CN113813597B | Information processing device, information processing system, program | 2021-04-21 |
| 31 | CN113902570A | Information processing device, information processing system, program | 2021-04-23 |
| 32 | CN113744551A | Information processing apparatus, non-transitory storage medium, and information method | 2021-05-27 |
| 33 | CN114119293A | Information processing device, information processing system, program | 2021-06-08 |
| 34 | CN113928246A | Information processing device, information processing system, program | 2021-06-08 |
| 35 | CN113852916B | Information processing system, information processing method, and recording medium | 2021-06-23 |
| 36 | CN114331248B | Method executed by information processing device, information processing device | 2021-08-20 |
| 37 | CN116331121A | Vehicle, information processing system, storage medium, and information method | 2022-10-26 |
| 38 | CN117273560A | Vehicles, electronic signature issuance systems, storage media and electronic method | 2023-03-23 |
| 39 | CN117227753A | Vehicles, information processing systems, and non-transitory computer-readable medium | 2023-03-27 |
| 40 | CN117252497A | Vehicles, methods and procedures | 2023-03-31 |
| 41 | CN117391570A | Management device, management system, management method and mobile body | 2023-06-30 |
| 42 | CN118261665A | Data management system, data management method and server | 2023-12-26 |
| 43 | CN119957041A | Information processing device | 2024-10-11 |
| 44 | CN120156448A | Information processing device | 2024-11-29 |
| 45 | CN120166291A | Information processing device | 2024-12-09 |
| 46 | CN120156443A | Information prompting device and vehicle | 2024-12-10 |
| 47 | CN120156444A | Voice guidance device, vehicle, and non-transitory computer-readable medium | 2024-12-11 |
| 48 | CN120156521A | Back-up assist device and vehicle | 2024-12-12 |
| 49 | CN120164348A | Information processing device, parking assistance method, and non-transitory medium | 2024-12-12 |
| 50 | TWI923233B | 車輛消耗品的補充支援方法、車輛消耗品的補充支援程式及資訊處理裝置 | 2024-12-27 |
| 51 | TW202539941A | Method, program and information processing device | 2024-12-27 |

### 同一発明の疑いがある組

- No.50 `TWI923233B` と No.51 `TW202539941A` は出願日が同じ（2024-12-27）。TW の公開公報と登録公報の関係の可能性が高い。同族が解決できていないため**今回は 2 件のまま載せ**、後日まとめる。

## 表 B: ローマ字表記「Josuke Yamane」で判明した US 文献（**未網羅・要確認**）

Google Patents の発明者検索ではなく Web 検索から拾ったもので、網羅していない。**今回の掲載には含めない。**

| 公報番号 | 発明の名称 | 状態 |
|---|---|---|
| US11818635 | Information processing system（複数の車両とサーバ。車外の人物が写る動画を撮影しサーバへ送信） | 表 A の 2019–2021 コネクテッド系と同一分野。同族の照合待ち |
| US11904879 | Information processing apparatus, recording medium, and information processing method | 共同発明者に Sakurada Shin・Minagawa Rio 等、表 A の CN 側と重なる。同族の照合待ち |
| US20210312475 | Information processing apparatus（車種ごとの訪問地の傾向を取得） | 同上 |
| US12686354 | Seat back with side airbag device | **分野が表 A と繋がらない。同姓同名の別人の疑い。掲載しない** |
