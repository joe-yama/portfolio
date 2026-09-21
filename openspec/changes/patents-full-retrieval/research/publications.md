# 特許の調査結果（2026-09-22 時点）

取得日 2026-09-22。出所は Google Patents（発明者クエリ `https://patents.google.com/xhr/query?url=q%3Din%3A"<名前>"%26num%3D100` と公報ページ `https://patents.google.com/patent/<番号>/{ja,en}`）。**同族は Google Patents の `Country Status` を基準に解決済み**（design.md D1）。手順の詳細は `research/method.md` を参照。

件数の内訳: 起点 **117 公報**（`山根丈亮` 51 件 ∪ `Josuke Yamane` 66 件、重複ゼロ）→ **65 同族を採用**（115 公報）／ **1 同族（2 公報）を除外**。採用した同族のうち JP の代表公報が無いもの（`titleJaProvisional: true`）が **2 件**ある。

## 掲載する見出しについて（裁定 D12・D13）

`career/{ja,en}.yaml` の `title` に載せるのは、**公報の正式名称ではなく、その発明が何をするものかを請求項 1 から起こした 1 行の見出し**である。Change 8 まで使っていた公報の正式名称（例: 「情報処理装置、プログラム、及び、情報処理方法」）は 65 件の大半が同系統の定型文になり、読み手が内容を推測できないという PO の指摘（2026-09-22）による。見出しの根拠は請求項 1 のみで、請求項に書かれていない効果や用途は推測して足していない。**正式名称は画面に表示せず、`career/*.yaml` にも持たせない**（D13）。この `publications.md` が正式名称を確認できる唯一の場所になる（下記「見出しの照合」）。

**修正ラウンド 1 回目（レビュー単位 A、裁定 R18）**: 当初版は請求項の抜粋を先頭 300 文字で切っており、根拠の語が抜粋の外にあるケースが多数あった（ja 65 件中 26 件、en 65 件中 60 件で途中切断）。**請求項 1 は全文を載せる**よう作り直し、`## 1. 掲載する全件の表` と `## 2. 見出しの照合表` の二重持ちをやめて 1 つの一覧（見出し・年月・国・請求項を 1 ブロックにまとめる）に統合した。

## 暫定名称について（Change 8 の裁定 D7b の解消状況）

JP の代表公報が無い同族が **2 件**あり（`US20250199754A1`, `US20250146351A1`）、日本語の見出しは JP のネイティブな請求項ではなく英語の請求項（`claimEn`）だけを根拠に起こしている（`titleJaProvisional: true`）。Change 8 の裁定 D7b（日本語の名称が暫定）は、この 2 件を除く 63 件では **JP 代表公報の実際の請求項から起こした見出しに置き換わり解消した**。残る 2 件は原文（JP 出願）を経由しない二次的な要約である点に注意（`research/method.md` および `.superpowers/sdd/tasks/task-1.5-report.md` の判断メモを参照）。

## 見出しの根拠言語について（`titleEnSource`）

日本語の見出しは、JP 代表公報がある 63 件では常に JP 代表公報自身の請求項 1（`/ja`）を根拠にしている。**英語の見出しの根拠は件ごとに異なる**（`patents.json` の `titleEnSource`）。内訳は US 代表の請求項 1（`/en`）を根拠にしたもの **47 件**、JP 代表の請求項 1（つまり日本語の見出しと同じ請求項の要約）を根拠にしたもの **17 件**、WO 代表の請求項 1（`/en`）を根拠にしたもの **1 件**（EP 代表を根拠にした件は無かった）。下記の一覧では、英語の見出しが JP 代表の請求項を根拠にしている場合、英語版の請求項の抜粋は**載せない**（日本語版の請求項と同じものを重複して載せることになるため）。

## 落とした公報 `JP7151181B2` について（Change 8 の掲載の再検討材料）

`JP7151181B2`「音声対話システム、その処理方法及びプログラム」は **Change 8 で PO の特許として掲載されていた**が、今回の機械照合（design.md D2）で発明者が一致せず除外した。この公報の発明者は渡部生聖・樋口佐和・堀達朗の 3 名で、PO（山根丈亮）は含まれない。`山根丈亮` の文字列は、この公報の説明文中に引用された参考文献 1 件（「上位語・下位語の射影関係とそのクラスタの同時学習、山根丈亮、高谷智哉、山田整、三輪誠、佐々木裕、第 22 回言語処理学会年次大会、B3-4、仙台、2016」）の著者としてのみ現れる。Google Patents の発明者検索が公報全文の一致で拾ったものが、Change 8 の PO による一括確認をすり抜けていたと考えられる。**この 1 件は除外が妥当と判断したが、Change 8 の掲載を覆すかどうかは PO の判断事項として残す**（下記「落とした公報の表」）。

## `US12686354`（サイドエアバッグ）について（Change 8 が「要確認」としていた件）

Change 8 が Web 検索で見つけ「分野が繋がらない・同姓同名の別人の疑い」として掲載を見送っていた `US12686354`（Seat back with side airbag device）は、今回の発明者クエリ 2 本（`山根丈亮` 51 件・`Josuke Yamane` 66 件）の**どちらの結果にも現れなかった**。別人の出願として除外を維持する。

## 見出しの照合（65 件全件）

65 件すべてについて、**出願年月・出願国・掲載する見出し（ja/en）・公報の正式名称（ja）・実際に根拠にした請求項 1 の全文**を 1 件 1 ブロックで並べる。並び順は画面に表示される順（`sortPatents`: 出願国・地域の数の降順 → `filedAt` の降順。同順位は記述順を保つ）。請求項は `patents.json` の `claim1Ja` / `claim1En` を**全文**そのまま載せる（打ち切らない）。どの公報のどの言語の請求項を根拠にしたかは `.superpowers/sdd/tasks/claims.json` の `repJp` / `repEn`（公報番号）で明記する。PO はこの一覧だけで「見出しが請求項の範囲を外れていないか」を照合できる（裁定 D12 の risk への対処）。

### 1. JP2021117840A

- 出願年月: 2020-01
- 出願国・地域: JP, KR, CN, US, BR, EP
- 見出し（ja）: 運転履歴から評価しサービスの信用度を算出
- 見出し（en）: Evaluating driving history to determine a user's credit score for a service
- 公報の正式名称（ja）: 情報処理装置、情報処理方法、及び、プログラム
- 請求項 1 全文（ja、根拠: JP2021117840A の `/ja`）: 第１の期間における、ユーザの車両の運転時の行動履歴を示す第１の情報を保持する記憶部と、 前記第１の期間分の前記第１の情報から前記ユーザの運転評価を行うことと、 前記ユーザの前記運転評価の結果に基づいて、所定のサービスにおける前記ユーザの信用の度合いを示す信用度を取得することと、 を実行する制御部と、 を備える情報処理装置。
- 請求項 1 全文（en、根拠: US20210233183A1 の `/en`）: 1. An information processing device comprising: a storage unit configured to store first information, the first information indicating a behavior history of a user during driving of a vehicle in a first period; and a control unit configured to perform a driving evaluation of the user based on the first information for the first period and configured to acquire a degree of credence based on a result of the driving evaluation of the user, the degree of credence indicating a degree of credit of the user in a predetermined service.

### 2. JP2025095991A

- 出願年月: 2023-12
- 出願国・地域: JP, CN, US, DE
- 見出し（ja）: 駐車枠の向きと車の角度差を検出し画面に案内
- 見出し（en）: Detecting the angle between a parking space and the vehicle, then showing guidance
- 公報の正式名称（ja）: 情報処理装置、駐車支援方法、及びプログラム
- 請求項 1 全文（ja、根拠: JP2025095991A の `/ja`）: 制御部と、表示部とを備え、前記制御部は、 駐車する先の駐車スペースを、長手方向及び短手方向を有する矩形領域として検出し、 前記矩形領域の長手方向と、車両の前後方向との角度差に関するガイド情報を、前記表示部によりバックビューの画面上に表示する 情報処理装置。
- 請求項 1 全文（en、根拠: US20250196922A1 の `/en`）: 1. An information processing apparatus comprising: a controller; and a display, wherein the controller is configured to: detect a parking space in which a vehicle is to be parked, as a rectangular area having a longitudinal direction and a shortitudinal direction; and display, by the display on a rear view screen, guide information regarding an angular difference between the longitudinal direction of the rectangular area and a front and rear direction of the vehicle.

### 3. JP7115325B2

- 出願年月: 2019-01
- 出願国・地域: JP, EP, US, CN
- 見出し（ja）: 歩行者の装着具画像から歩道の日陰や光源位置を検出
- 見出し（en）: Detecting shaded or lit sidewalk spots from vehicle camera images of pedestrian gear
- 公報の正式名称（ja）: サーバ、車載装置、車両、プログラム、及び情報提供方法
- 請求項 1 全文（ja、根拠: JP7115325B2 の `/ja`）: 歩道を含む車両周辺を撮像して撮像画像を生成する車載装置から、撮像日時及び撮像位置を受信する受信部と、 前記撮像画像及び前記撮像位置から検出される、前記撮像日時における前記歩道の明暗情報を記憶する記憶部と、 前記明暗情報を携帯端末に送信する送信部と、 を有するサーバであって、 前記明暗情報は、前記歩道における昼間時に日陰を有する部分の位置、または前記歩道における夜間時に光源からの光を受ける部分の位置を有し、 前記撮像画像から所定の装着具を装着した人物画像が検出されることを条件として、昼間時における前記日陰を有する部分の位置が検出される、 サーバ。
- 請求項 1 全文（en、根拠: US11140530B2 の `/en`）: 1. A server, comprising: circuitry configured to: receive information on an image capture date and time and an image capture location from an on-board device that is configured to capture an image of surroundings of a vehicle and produce the captured image, the surroundings including a sidewalk; store brightness information of the sidewalk on the image capture date and time, the brightness information being detected based on the captured image and the image capture location; and send the brightness information to a mobile terminal, wherein the brightness information contains at least one of information on a position of a part of the sidewalk shaded in daytime and information on a position of a part of the sidewalk lit by a light source in nighttime, and the position of the part of the sidewalk shaded in the daytime is detected on a condition that an image of a person wearing a predetermined tool is detected from the captured image.

### 4. JP7147513B2

- 出願年月: 2018-11
- 出願国・地域: JP, EP, US, CN
- 見出し（ja）: 掲示の文字認識で駐車場の空きと料金を検出し推薦
- 見出し（en）: Recognizing parking sign text to detect vacancy and fee, then recommending a lot
- 公報の正式名称（ja）: 情報提供システム、サーバ、車載装置及び情報提供方法
- 請求項 1 全文（ja、根拠: JP7147513B2 の `/ja`）: 車載装置と、前記車載装置と情報を送受信するサーバとを有する情報提供システムにおいて、 前記車載装置は、 目的地及び出力モードを取得して前記サーバに送信する条件設定部と、 前記サーバから受信する駐車場推薦情報を出力する出力部と を有し、 前記サーバは、 駐車場の位置情報と当該駐車場の撮像画像から検出される駐車料金とを含む駐車場情報を記憶する記憶部と、 前記目的地から所定の範囲内に位置する駐車場に前記出力モードに応じた優先順位付けをし、当該優先順位付けされた駐車場の駐車場情報を駐車場推薦情報として前記車載装置に提供する、駐車場推薦情報提供部と、 を有し、さらに、 前記撮像画像から前記駐車場に設置された掲示における文字を文字認識することで当該駐車場の空き状況を検出し、当該空き状況を含む前記駐車場情報を生成する、駐車場情報生成部を有する、 情報提供システム。
- 請求項 1 全文（en、根拠: US11074816B2 の `/en`）: 1. An information providing system comprising: an onboard device; and a server configured to transmit information to and receive information from the onboard device, wherein the onboard device includes: (i) processing circuitry configured to: acquire a destination and an output mode, and transmit the acquired destination and the acquired output mode to the server, and (ii) output interface circuitry that includes a display, the output interface circuitry configured to output parking lot recommendation information received from the server to the display, and the server includes: (i) storage circuitry configured to store parking lot information including position information of parking lots and parking fees which are detected from captured image data of the parking lots, the captured image data being (a) captured by one or more vehicles traveling within a predetermined distance from the parking lots and (b) transmitted to the server, and (ii) processing circuitry configured to: detect the parking fees from the captured image data via a character recognition process, prioritize parking lots located within a predetermined range from the destination based on the output mode, and provide the parking lot information of the prioritized parking lots as the parking lot recommendation information to the onboard device.

### 5. JP2025096043A

- 出願年月: 2023-12
- 出願国・地域: JP, US, CN
- 見出し（ja）: 座席の使用状況で基準距離を変え障害物までの目安を表示
- 見出し（en）: Adjusting a reversing guide distance to seat occupancy and marking it near obstacles
- 公報の正式名称（ja）: 後退支援装置及び車両
- 請求項 1 全文（ja、根拠: JP2025096043A の `/ja`）: 車両の運転席側及び助手席側の各座席の使用状況を監視し、 前記使用状況に応じて、前記運転席側及び前記助手席側それぞれの参照距離を設定し、 前記車両の後退時に、前記車両の進行先として予測されるスペースの側方に障害物を検知すると、前記車両の後退を支援するために前記車両の後方の画像を映し出す画面上に、検知した障害物から前記参照距離だけ離れた位置を示すガイド要素を表示する 制御部を備える後退支援装置。
- 請求項 1 全文（en、根拠: US20250196774A1 の `/en`）: 1. A backing assistance apparatus comprising a controller configured to: monitor a usage of each seat on a driver side and a passenger side of a vehicle; set a reference distance on each of the driver side and the passenger side according to the usage; and upon detecting an obstacle on a side of a space to which the vehicle is predicted to proceed when the vehicle is backing, display, on a screen that shows an image of a rear of the vehicle to assist in backing the vehicle, a guide element indicating a position that is distant from the detected obstacle by the reference distance.

### 6. JP2025105050A

- 出願年月: 2023-12
- 出願国・地域: JP, WO, TW
- 見出し（ja）: トリガー検知でエンジンルーム画像と補充口位置を案内
- 見出し（en）: Displaying engine bay images and refill port location upon a vehicle trigger
- 公報の正式名称（ja）: 方法、プログラム及び情報処理装置
- 請求項 1 全文（ja、根拠: JP2025105050A の `/ja`）: 情報処理装置が実行する方法であって、 車両に関する所定のトリガの発生を検出すると、前記車両のエンジンルームの画像を表示すること、 前記車両に対して補充する消耗品を特定すること、及び 特定された前記消耗品に対応する、前記エンジンルーム内の補充口の位置を含む支援情報を表示すること を含む、方法。
- 請求項 1 全文（en、根拠: WO2025142192A1 の `/en`）: A method executed by an information processing device, comprising: upon detecting an occurrence of a predetermined trigger related to the vehicle, displaying an image of an engine compartment of the vehicle; identifying a consumable item to be replenished for the vehicle; and displaying support information including a location of a refill port in the engine compartment corresponding to the identified consumable item.

### 7. JP7852619B2

- 出願年月: 2023-12
- 出願国・地域: JP, CN, US
- 見出し（ja）: 施錠時の車内閉じ込めを検知し解錠手順を車内に提示
- 見出し（en）: Detecting a person trapped inside a locked car and guiding them to unlock the door
- 公報の正式名称（ja）: 情報提示装置及び車両
- 請求項 1 全文（ja、根拠: JP7852619B2 の `/ja`）: 車両の中に設置された出力部と、 前記車両の外での施錠操作により前記車両のドアが施錠されたときに前記車両の中に人が閉じ込められているか否かを判定し、 前記車両の中に人が閉じ込められていると判定すると、前記ドアを解錠及び開放する手順を示す情報を、前記出力部を介して提示する 制御部と を備える情報提示装置。
- 請求項 1 全文（en、根拠: US20250201096A1 の `/en`）: 1. An information presentation apparatus comprising: an output interface installed inside a vehicle; and a controller configured to: determine whether a person is trapped inside the vehicle when a door of the vehicle is locked by a locking operation outside the vehicle; and present, upon determining that a person is trapped inside the vehicle, information indicating procedures for unlocking and opening the door via the output interface.

### 8. JP2025095982A

- 出願年月: 2023-12
- 出願国・地域: JP, CN, US
- 見出し（ja）: バックドアの突出量から障害物までの目安距離を画面表示
- 見出し（en）: Showing a rear obstacle guide distance based on the tailgate's rearward swing
- 公報の正式名称（ja）: 情報処理装置
- 請求項 1 全文（ja、根拠: JP2025095982A の `/ja`）: 制御部と、表示部とを備え、前記制御部は、 バックドアの開閉動作中における車両後方側への最大突出長さに基づいて参照距離を決定し、 車両の駐車開始時に後方障害物が検出されると、前記後方障害物から前記参照距離だけ離れた位置を示すガイド画像を、前記表示部によりバックビューの画面上に表示する 情報処理装置。
- 請求項 1 全文（en、根拠: US20250196772A1 の `/en`）: 1. An information processing apparatus comprising: a controller; and a display, wherein the controller is configured to: determine a reference distance based on a maximum protrusion length toward a vehicle rear side during opening and closing operation of a back door; and display on a back view screen using the display, upon detection of a rear obstacle at a time of a start of parking a vehicle, a guide image indicating a position that is distant from the rear obstacle by the reference distance.

### 9. JP2025095979A

- 出願年月: 2023-12
- 出願国・地域: JP, US, CN
- 見出し（ja）: 短押しで静止画、長押しで動画を撮る車載カメラ操作
- 見出し（en）: A single button that takes a photo on a short press and records video on a long press
- 公報の正式名称（ja）: 情報処理装置
- 請求項 1 全文（ja、根拠: JP2025095979A の `/ja`）: 車両に搭載された情報処理装置であって、 車外風景を撮像する撮像部と、 ユーザの撮影操作を受け付ける入力部と、 第１撮影操作が検出された場合、前記撮像部により静止画像を撮影し、第２撮影操作が検出された場合、前記撮像部により動画を撮影するように制御する制御部と、 を備え、 前記第１撮影操作は短押し操作であり、前記第２撮影操作は長押し操作である、情報処理装置。
- 請求項 1 全文（en、根拠: US20250196785A1 の `/en`）: 1. An information processing apparatus to be mounted in a vehicle, the information processing apparatus comprising: an imager configured to capture an image of scenery outside the vehicle; an input interface configured to accept a capturing operation by a user; and a controller configured to control the imager to capture a still image in a case in which a first capturing operation is detected and capture a moving image in a case in which a second capturing operation is detected, the first capturing operation being a short press operation and the second capturing operation is a long press operation.

### 10. JP7856003B2

- 出願年月: 2022-12
- 出願国・地域: JP, US, CN
- 見出し（ja）: 運転目標の達成をNFTで判定し証明として付与
- 見出し（en）: Certifying achievement of driving goals with an NFT reward tied to the goal
- 公報の正式名称（ja）: データ管理システム、データ管理方法およびサーバ
- 請求項 1 全文（ja、根拠: JP7856003B2 の `/ja`）: データ管理システムであって、 デジタルアセットを非代替性トークンとして管理するサーバと、 車両のドライバが前記非代替性トークンを獲得するために使用される第１コンピュータ機器とを備え、 前記サーバは、運転時に達成されることが望ましい環境および安全のうちの少なくとも一方に関する条件である複数の目標条件の各々を前記非代替性トークンに関連付けて登録し、 前記非代替性トークンは、前記非代替性トークンを視覚的に確認するためのデジタル画像を含み、 前記第１コンピュータ機器は、前記複数の目標条件の中から前記ドライバにより選択された目標条件を前記サーバに通知し、 前記データ管理システムは、 前記目標条件の登録を要求する第２コンピュータ機器と、 前記デジタル画像の登録を要求する第３コンピュータ機器とを更に備え、 前記サーバは、 前記目標条件と、前記目標条件の登録者を示す登録者情報と、前記デジタル画像と、前記デジタル画像のデザイナを示すデザイナ情報とを関連付けて前記非代替性トークンに登録し、 前記ドライバによる前記車両の運転が前記選択された目標条件を達成したかどうかを判定するためのデータを前記車両、前記第１コンピュータ機器または外部サーバから取得し、 前記ドライバによる前記車両の運転が前記選択された目標条件を達成した場合、達成された目標条件、前記登録者情報、前記デジタル画像および前記デザイナ情報に関連付けられた前記非代替性トークンを前記第１コンピュータ機器に付与する、データ管理システム。
- 請求項 1 全文（en、根拠: US20240221102A1 の `/en`）: 1. A data management system comprising: a server that manages a digital asset as a non-fungible token (NFT); and a first computer apparatus used by a driver of a vehicle to acquire the NFT, wherein the server registers each of a plurality of target conditions in association with the NFT, the plurality of target conditions being conditions concerning at least one of environment and safety that are desired to be achieved during driving, the first computer apparatus notifies the server of a target condition selected by the driver from the plurality of target conditions, the server obtains, from the vehicle, the first computer apparatus, or an external server, data for determining whether driving of the vehicle by the driver has achieved the selected target condition, and when the driving of the vehicle by the driver has achieved the selected target condition, the server gives the NFT associated with the achieved target condition to the first computer apparatus.

### 11. JP7666423B2

- 出願年月: 2022-07
- 出願国・地域: JP, CN, US
- 見出し（ja）: 降雨予測時は配達物を容器に収めて配送するロボット管理
- 見出し（en）: Determining a delivery position from environmental information at the destination
- 公報の正式名称（ja）: 管理装置、管理システム、管理方法及び移動体
- 請求項 1 全文（ja、根拠: JP7666423B2 の `/ja`）: 配達物品を配達先の配達位置に置くことによって配達する移動体を管理する制御部を備え、 前記制御部は、 前記配達先の天気に関する情報を、外部装置、前記移動体、又は、前記配達先に設置された検出装置から取得し、 前記配達先で降水がある場合又は前記配達先における所定時間内の降水が予測されている場合に、前記移動体が前記配達先に前記配達物品を収容可能な配達容器を設置して前記配達容器に前記配達物品を置くように前記移動体を制御する、 管理装置。
- 請求項 1 全文（en、根拠: US20240013132A1 の `/en`）: 1. A management apparatus comprising a controller configured to manage a mobile object for delivering a delivery article by placing the delivery article at a delivery position, wherein the controller is configured to determine the delivery position based on environmental information for a delivery destination and control the mobile object to place the delivery article at the delivery position.

### 12. JP7711636B2

- 出願年月: 2022-06
- 出願国・地域: JP, CN, US
- 見出し（ja）: 置き配後の修正指示で荷物を別の場所へ移動する車両
- 見出し（en）: A delivery vehicle that relocates a package after receiving a correction from the user
- 公報の正式名称（ja）: 車両、情報処理システム、プログラム、及び端末装置
- 請求項 1 全文（ja、根拠: JP7711636B2 の `/ja`）: 荷物の配送を自律的に行う車両であって、 前記車両が第１位置に前記荷物を置き配したときの第１画像を撮像してユーザに送信し、前記第１画像を確認した前記ユーザからの修正情報であって置き配場所を修正するための前記修正情報を受信すると、前記修正情報に基づいて前記置き配場所を前記第１位置から第２位置へと修正するように前記車両を駆動する制御部、 を備え、 前記制御部は、前記車両が前記第１位置に前記荷物を置き配してから所定時間経過した後に前記修正情報を受信すると、前記置き配場所の最寄りに位置する他の前記車両が前記修正情報に基づいて前記置き配場所を前記第１位置から前記第２位置へと修正するように第１制御指令を送信する、 車両。
- 請求項 1 全文（en、根拠: US20230409029A1 の `/en`）: 1. A vehicle that autonomously delivers a package, the vehicle comprising a control unit that captures a first image when the vehicle leaves the package at a first position and transmits the first image to a user and drives the vehicle such that a delivery point is corrected from the first position to a second position based on correction information for correcting the delivery point, the correction information being information from the user who has confirmed the first image, when receiving the correction information.

### 13. JP7683552B2

- 出願年月: 2022-06
- 出願国・地域: JP, CN, US
- 見出し（ja）: 宛先の署名発行機とパスワード照合し荷物を届ける車両
- 見出し（en）: A delivery vehicle that matches passwords with a destination's signer before drop-off
- 公報の正式名称（ja）: 車両、電子署名発行システム、プログラム、及び電子署名発行機
- 請求項 1 全文（ja、根拠: JP7683552B2 の `/ja`）: 荷物の配送を自律的に行う車両であって、 前記荷物の配送情報を取得し、取得された前記配送情報を、前記荷物の配送先のユーザの端末装置に送信し、前記配送情報を確認した前記ユーザから電子署名発行の許可を受け付けた前記端末装置から電子署名発行機と共有される一のパスワードを取得し、前記車両が前記配送先に到着すると、前記荷物と前記配送先との照合のために、前記配送先に設置されている前記電子署名発行機と通信を実行して前記パスワードを前記電子署名発行機に提供し、前記車両から取得した前記パスワードが前記端末装置から取得した前記パスワードと一致して前記荷物と前記配送先との照合が前記電子署名発行機において成立すると前記電子署名発行機から電子署名を取得し、前記荷物を前記配送先に置き配するように前記車両を駆動する制御部、 を備える、 車両。
- 請求項 1 全文（en、根拠: US12384421B2 の `/en`）: 1. A vehicle that autonomously delivers a package, the vehicle comprising a control unit configured to: notify a user at a delivery destination of delivery information of the package; receive a first password from a terminal device; transmit the first password to an electronic signature issuing machine installed at the delivery destination; communicate with the electronic signature issuing machine installed at the delivery destination for collating the package with the delivery destination of the package; when the first password matches a second password owned by the electronic signature issuing machine, acquire an electronic signature from the electronic signature issuing machine; and drive the vehicle such that the package is left at the delivery destination.

### 14. JP7677243B2

- 出願年月: 2022-06
- 出願国・地域: JP, CN, US
- 見出し（ja）: 大きさ・重さ・上積厳禁マークの有無を比較し積み重ねを判断
- 見出し（en）: Determining whether to stack a new package based on package information
- 公報の正式名称（ja）: 車両、方法、及びプログラム
- 請求項 1 全文（ja、根拠: JP7677243B2 の `/ja`）: 荷物を配送する車両であって、 制御部、及び置き配場所への荷下ろしを行う駆動部を備え、 前記制御部は、現在の配送に係る荷物、及び既に置き配されている荷物の荷物情報に基づいて、荷物を積み重ねるか否かを決定し、 前記現在の配送に係る荷物よりも、前記既に置き配されている荷物が大きく、重く、且つ上積厳禁マークが貼付されていない荷物であると判定すると、前記駆動部を介して、前記既に置き配されている荷物に前記現在の配送に係る荷物を積み重ねる、車両。
- 請求項 1 全文（en、根拠: US20230405832A1 の `/en`）: 1. A vehicle comprising a control unit that determines whether a package is stacked based on package information.

### 15. JP7626057B2

- 出願年月: 2021-12
- 出願国・地域: JP, CN, US
- 見出し（ja）: 二次元コードのURL照合で指定の置き配場所を確認して配送
- 見出し（en）: Verifying a drop-off spot via 2D code URL matching before autonomous delivery
- 公報の正式名称（ja）: 車両、情報処理システム、プログラム、及び情報処理装置
- 請求項 1 全文（ja、根拠: JP7626057B2 の `/ja`）: 荷物の配送を自律的に行う車両であって、 前記荷物の配送に対する置き配場所のユーザによる指定に伴って生成された指定情報を取得し、取得された前記指定情報に基づく前記置き配場所の照合により、前記ユーザにより指定された前記置き配場所を識別すると、前記荷物を前記置き配場所に置くように前記車両を駆動させる制御部、 を備え、 前記指定情報は、前記ユーザが前記置き配場所に配置した二次元コードから読み取り可能なＵＲＬ情報を含み、 前記制御部は、前記ＵＲＬ情報と、前記置き配場所の指定にあたり事前に登録された登録ＵＲＬ情報であって、前記二次元コードに関連付けられる前記登録ＵＲＬ情報と、を互いに比較することで前記置き配場所の照合を実行する、 車両。
- 請求項 1 全文（en、根拠: US12141737B2 の `/en`）: 1. A vehicle configured to autonomously deliver a package, the vehicle comprising a processor configured to: acquire designation information generated along with designation by a user about an unattended delivery location for delivery of the package, the designation information includes uniform resource locator information readable from a two-dimensional code arrange at the unattended delivery location by the user, and arrangement information indicating a specific arrangement location of the two-dimensional code and readable from the two-dimensional code; verify the unattended delivery location by comparing the uniform resource locator information and registered uniform resource locator information that is preregistered when designating the unattended delivery location and is associated with the two-dimensional code; identify the unattended delivery location designated by the user by verifying the unattended delivery location; control the vehicle to autonomously deliver the package to the unattended delivery location designated by the user when the unattended delivery location is identified; and when the processor determines that a position of the two-dimensional code does not agree with a position indicated by the arrangement information, control the vehicle to autonomously bring the package back without leaving the package.

### 16. JP7420036B2

- 出願年月: 2020-09
- 出願国・地域: JP, US, CN
- 見出し（ja）: 積載空間と商品寸法と運転傾向から積み込み手順を決定
- 見出し（en）: A vehicle that autonomously drives to a store, loads a purchased item, and pays for it
- 公報の正式名称（ja）: 方法、情報処理装置、及びプログラム
- 請求項 1 全文（ja、根拠: JP7420036B2 の `/ja`）: 情報処理装置が実行する方法であって、 車両の積載空間に関する情報を有する第１情報を取得すること、 ユーザによって選択された複数の第１商品の寸法を示す情報を有する第２情報を取得すること、 前記ユーザが車両を運転する際の運転傾向を示す第３情報を取得すること、 前記第１情報、前記第２情報、及び前記第３情報に基づいて、前記車両に前記複数の第１商品を積載する手順を決定すること、及び 前記複数の第１商品を積載する前記手順を通知すること を含む、方法。
- 請求項 1 全文（en、根拠: US11928751B2 の `/en`）: 1. A method that is executed by an information processing device, the method comprising: acquiring first information regarding a vehicle including an image captured of a loading space of the vehicle, the vehicle including an autonomous vehicle; acquiring second information regarding a first product selected by a user to be loaded at a first location, the second information indicating whether the first product is allowed to be loaded under another product; deciding a procedure for loading the first product into the vehicle based on the first information and the second information; sending a notification of the procedure for loading the first product to the vehicle; determining whether or not the first product is loadable into the vehicle based on the first information and the second information; performing electronic settlement of the first product when determination is made that the first product is loadable, and causing, in response to the notification and when the determination is made that the first product is loadable into the vehicle, the vehicle to execute autonomous driving in an unmanned manner to a store that sells the first product; performing notification of information making the user confirm whether or not to proceed to the electronic settlement of the first product when determination is made that the first product is not loadable; receiving a first response confirming to proceed to the electronic settlement of the first product from the user; performing the electronic settlement of the first product in response to the first response received from the user; updating the first information based on the second information; acquiring new second information regarding a second product selected by the user to be loaded at a second location; deciding a procedure for loading the second product into the vehicle based on the updated first information and the new second information, the procedure includes temporarily removing the first product from the vehicle and loading the first product on top of the second product when the second information indicates that the first product is not allowed to be loaded under another product; sending a notification of the procedure for loading the second product to the vehicle; determining whether the second product is loadable into the vehicle based on the updated first information and the new second information; performing electronic settlement of the second product when determination is made that the second product is loadable; performing notification of information making the user confirm whether or not to proceed to the electronic settlement of the second product when determination is made that the second product is not loadable; receiving a second response confirming to proceed to the electronic settlement of the second product from the user; and performing the electronic settlement of the second product in response to the second response received from the user.

### 17. JP7310729B2

- 出願年月: 2020-06
- 出願国・地域: JP, US, CN
- 見出し（ja）: 他ルートの実走行を再現し別ルートの車両制御に利用
- 見出し（en）: Reproducing a vehicle's own driving state, including its vibration pattern, on its route
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7310729B2 の `/ja`）: 第１走行ルート上を走行する第１車両の実際の走行情報を取得し、取得された前記第１車両の前記走行情報に基づいて前記第１走行ルートにおける前記第１車両の走行状態を再現する制御情報を生成する、制御部、 を備え、 前記制御情報は、前記第１走行ルートとは異なる第２走行ルートを走行する第２車両の走行状態を制御する情報を含み、 前記制御部は、前記第２車両に対して前記制御情報を提供する、 情報処理装置。
- 請求項 1 全文（en、根拠: US11670187B2 の `/en`）: 1. An information processing device comprising a control unit configured to acquire actual traveling information about a first vehicle that travels along a first traveling route, and to generate control information based on the acquired traveling information about the first vehicle, the control information being information for reproducing a traveling state of the first vehicle on the first traveling route and a driving state of the first vehicle that includes information on a vibration pattern.

### 18. JP7331792B2

- 出願年月: 2020-06
- 出願国・地域: JP, CN, US
- 見出し（ja）: 乗員構成と機嫌を推定し過去データから施設サービスを決定
- 見出し（en）: Inferring occupant makeup and mood to recommend a facility service from past data
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7331792B2 の `/ja`）: 車両の車室内に設置された乗員を検出する第１センサからの第１情報と、前記車両のドアの開閉を検出する第２センサからの第２情報と、を取得し、取得された前記第１情報に基づいて前記乗員の構成情報を推定し、取得された前記第２情報に基づいて前記乗員の機嫌情報を推定し、推定された前記構成情報及び前記機嫌情報を、前記構成情報及び前記機嫌情報とサービス施設において享受したサービス内容とが関連付けられた他の乗員に対する過去のデータと比較することで、前記乗員に対し推定された前記構成情報及び前記機嫌情報に適合する、サービス施設でのサービス内容を決定し、決定された前記サービス内容を前記サービス施設に提供する制御部、 を備える、 情報処理装置。
- 請求項 1 全文（en、根拠: US20210403040A1 の `/en`）: 1. An information processing device comprising: a control unit that determines a service content fit for an occupant by acquiring first information from a first sensor installed in a vehicle cabin of a vehicle for detecting the occupant and second information from a second sensor for detecting opening and closing of a door of the vehicle, estimating composition information of the occupant based on the first information that is acquired, estimating mood information of the occupant based on the second information that is acquired, and comparing the composition information and the mood information that are estimated with past data for another occupant in which the composition information and the mood information are associated with a service content received at a service facility.

### 19. JP7396214B2

- 出願年月: 2020-06
- 出願国・地域: JP, US, CN
- 見出し（ja）: 感染者の訪問履歴から同時刻の来訪者に感染リスクを通知
- 見出し（en）: Notifying visitors who overlapped with an infected person's visit of exposure risk
- 公報の正式名称（ja）: 情報処理システム、情報処理方法、及び、プログラム
- 請求項 1 全文（ja、根拠: JP7396214B2 の `/ja`）: 第１の情報処理装置と、所定の感染症の罹患が判明した感染者が来訪した第１の場所をそれぞれ管理する複数の第２の情報処理装置と、 を備える情報処理システムであって、 前記第１の情報処理装置は、 前記感染者の移動履歴情報を取得することと、 前記移動履歴情報に基づいて、前記第１の場所及び前記第１の場所への第１の来訪日時を特定することと、 前記第２の情報処理装置へ、前記第１の場所に関する情報及び前記第１の来訪日時に関する情報を通知することと、 を実行する第１の制御部を備え、 前記複数の第２の情報処理装置のそれぞれは、 前記第１の場所へ来訪したユーザの前記第１の場所への来訪日時を含む来訪履歴情報に基づいて、前記第１の情報処理装置から通知された前記感染者の前記第１の来訪日時に前記第１の場所を来訪していた第１のユーザを特定することと、 前記第１のユーザに前記所定の感染症の感染の可能性を通知することと、 を実行する第２の制御部と、 を備える、 情報処理システム。
- 請求項 1 全文（en、根拠: US12586688B2 の `/en`）: 1. An information processing system comprising: a first server; a plurality of second servers that are associated with respective predetermined places; and a user terminal including a third processor, wherein: the first server includes a first processor configured to: acquire movement history information on an infected person who is proven to be infected with a predetermined infectious disease; identify, based on the movement history information, a first place that the infected person visited and a first visit date and time by the infected person; and notify a second server associated with the first place of information about the first place and information about the first visit date and time; and the plurality of second servers each include a second processor configured to: based on visit history information including a visit date and time of the predetermined place by a user who is associated with the predetermined place, identify a first user who visited the predetermined place, as the first place, on the first visit date and time of the infected person notified from the first server; and notify the first user of possibility of being infected with the predetermined infectious disease; the first processor is further configured to: receive an infection report from a user terminal of the infected person, together with the movement history information; assign identification information to the infection report; notify the user terminal of the infected person of the identification information; and notify the second server associated with the first place of the identification information, together with the information about the first place and the information about the first visit date and time; the second processor is further configured to: transmit, to a user terminal of the first user, the identification information together with a notification about the possibility of being infected with the predetermined infectious disease; and the third processor is further configured to: transmit the infection report to the first server; receive, from the first server, first identification information assigned to the infection report; receive, from one of the plurality of second servers, the identification information together with the notification about the possibility of being infected with the predetermined infectious disease; compare the identification information received from the one of the plurality of second servers with the first identification information received from the first server; discard the notification received from the one of the plurality of second servers in a case where the identification information received from the one of the plurality of second servers is identical to the first identification information received from the first server; and output the notification in a case where the identification information received from the one of the plurality of second servers is not identical to the first identification information received from the first server.

### 20. JP7347344B2

- 出願年月: 2020-06
- 出願国・地域: JP, US, CN
- 見出し（ja）: 周囲の運転評価と走行データを比較し保険料を決定
- 見出し（en）: Determining insurance premiums by comparing driving data with nearby evaluations
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7347344B2 の `/ja`）: 第１車両の運転に関連して得られる走行情報と、前記第１車両の周囲を走行する第２車両の乗員による前記第１車両の運転に対する評価情報と、を取得し、取得された前記走行情報と前記評価情報との比較処理に基づいて前記第１車両の運転者に対する自動車保険の保険料を決定する、制御部、 を備え、 前記制御部は、前記比較処理において、前記第１車両の前記走行情報の内容が前記評価情報の内容に適合しているか否かを判定する、 情報処理装置。
- 請求項 1 全文（en、根拠: US20210398224A1 の `/en`）: 1. An information processing device comprising a control unit configured to acquire traveling information and evaluation information, and to decide a premium of an automobile insurance for a driver of a first vehicle, based on a comparison process of the acquired traveling information and the acquired evaluation information, the traveling information being obtained in association with driving of the first vehicle, the evaluation information being information about evaluation of the driving of the first vehicle by an occupant of a second vehicle that travels in a periphery of the first vehicle.

### 21. JP7415822B2

- 出願年月: 2020-06
- 出願国・地域: JP, CN, US
- 見出し（ja）: 駐車場内の急な運転操作地点を検出し施設に改善情報を提供
- 見出し（en）: Sending a facility improvement report with location data after abrupt driving is detected
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7415822B2 の `/ja`）: 車両の運転に関する操作情報と前記車両の位置情報とを取得し、取得された前記操作情報が閾値に達したと判定すると、前記操作情報が前記閾値に達したときの前記位置情報を含む、前記車両の走行環境の改善情報を生成し、生成された前記改善情報をサービス施設に提供する制御部、 を備え、 前記制御部は、前記操作情報が前記閾値に達したときの前記位置情報及び前記操作情報の少なくとも一方に基づいて、前記走行環境の改善方法を含む前記改善情報を生成し、 前記改善情報は、前記サービス施設の担当者が前記車両の走行環境を改善するために用いられ、 前記位置情報は、前記サービス施設の駐車場内を走行する前記車両の位置を含み、 前記制御部は、前記駐車場における前記走行環境の前記改善情報を生成する、 情報処理装置。
- 請求項 1 全文（en、根拠: US20210403027A1 の `/en`）: 1. An information processing device comprising a control unit that acquires operation information related to driving of a vehicle and position information of the vehicle, generates improvement information on a traveling environment of the vehicle when the control unit determines that the operation information that is acquired has reached a threshold value, the improvement information including the position information when the operation information reaches the threshold value, and provides the improvement information that is generated to a service facility.

### 22. JP7327279B2

- 出願年月: 2020-05
- 出願国・地域: JP, US, CN
- 見出し（ja）: 信号切替時に発進と停止をスマホで運転者に通知
- 見出し（en）: Notifying a driver via phone to start and stop at a traffic signal change
- 公報の正式名称（ja）: 情報処理装置、プログラム、および情報処理方法
- 請求項 1 全文（ja、根拠: JP7327279B2 の `/ja`）: 交通信号機の表示が車両の停止を指示する第１信号から車両の進行を許可する第２信号に切り替わったことを検出することと、 前記交通信号機の表示が前記第１信号から前記第２信号に切り替わったときに、前記交通信号機の手前で停止している第１車両を検出することと、 前記第１車両の運転者が所持する携帯端末に対して、前記第１車両の発進を前記運転者に促すための第１通知の出力を指示する第１指令を送信することと、 前記交通信号機の表示が前記第１信号から前記第２信号に切り替わり、前記第１車両が発進し始めたことを検出した後、前記第１車両の前方に存在している他車両を検出することと、 前記他車両と前記第１車両との間の距離が所定距離以下となったことを検出した場合、前記携帯端末に対して、前記第１車両の停止を前記運転者に促すための第２通知の出力を指示する第２指令を送信することと、 を実行する制御部を備える情報処理装置。
- 請求項 1 全文（en、根拠: US20210370964A1 の `/en`）: 1. An information processing device comprising a controller configured to: detect that display of a traffic light is switched from a first signal instructing a vehicle to stop to a second signal allowing the vehicle to proceed, and transmit a first command to a mobile terminal carried by a driver of a first vehicle that is stopped before the traffic light, when the display of the traffic light is switched from the first signal to the second signal, the first command instructing that a first notification for urging the driver to start moving the first vehicle be output.

### 23. JP2021189770A

- 出願年月: 2020-05
- 出願国・地域: JP, CN, US
- 見出し（ja）: 地域の車両情報と過去データから地価を推定
- 見出し（en）: Estimating regional land prices from vehicle-related information
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP2021189770A の `/ja`）: 一の地域において走行する車両に関連する情報を取得し、取得された前記情報を、前記情報と地価情報とが地域ごとに関連付けられた過去のデータと比較することで、前記一の地域における前記地価情報を推定する制御部、 を備える、 情報処理装置。
- 請求項 1 全文（en、根拠: US20210372804A1 の `/en`）: 1. An information processing device comprising a control unit that acquires information related to a vehicle traveling in one area and compares the acquired information with past data in which the information and land price information are associated with each other for each area so as to estimate the land price information in the one area.

### 24. JP7331773B2

- 出願年月: 2020-05
- 出願国・地域: JP, US, CN
- 見出し（ja）: 乗員の過去の嗜好から目的地を決め混雑も予測
- 見出し（en）: Deciding a repeat passenger's destination from previously generated preference data
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7331773B2 の `/ja`）: １台以上の車両の過去の走行によって前記車両の一の乗員に対して得られた前記車両の走行情報及び位置情報を取得し、取得された前記走行情報及び前記位置情報に基づいて前記一の乗員の嗜好情報を生成し、前記車両に乗車した乗員が過去に前記車両に乗車した前記一の乗員であって、かつ前記嗜好情報が前記乗員に対して生成されていると判定すると、前記乗員の前記嗜好情報に基づいて目的地情報を決定する制御部、 を備え、 前記目的地情報は、前記嗜好情報に基づく前記乗員の嗜好が反映された施設の位置情報を含み、 前記制御部は、前記施設に向かった前記車両の前記乗員の人数と前記施設における滞留時間とを関連付けた過去のデータを取得し、取得された前記データに基づいて前記施設の現在及び今後の混雑情報を推測する、 情報処理装置。
- 請求項 1 全文（en、根拠: US20210342752A1 の `/en`）: 1. An information processing device, comprising a control unit that acquires traveling information and location information of a vehicle acquired based on past traveling of at least one vehicle for one occupant of the vehicle, the vehicle included in the at least one vehicle, generates preference information of the one occupant based on the traveling information and the location information that are acquired, and determines destination information based on the preference information of the occupant when the control unit determines that an occupant who is on board the vehicle is the one occupant who has boarded the vehicle in the past and the preference information is generated for the occupant.

### 25. JP7331781B2

- 出願年月: 2020-05
- 出願国・地域: JP, US, CN
- 見出し（ja）: 乗員の状態を推測し似た過去データから適切な施設を決定
- 見出し（en）: Choosing a facility and driving mode based on an occupant's inferred drowsiness or fatigue
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7331781B2 の `/ja`）: 車両の乗員の生体情報及び乗員情報を取得し、取得された前記生体情報に基づいて前記乗員の状態情報を推測し、推測された前記状態情報及び取得された前記乗員情報を、前記状態情報及び前記乗員情報と利用したサービス施設の施設情報とが関連付けられた他の乗員に対する過去のデータと比較し、推測された前記状態情報及び取得された前記乗員情報にそれぞれ類似する、前記過去のデータにおける前記状態情報及び前記乗員情報が関連付けられている前記施設情報に従って、前記乗員に適合するサービス施設を決定する制御部、 を備える、 情報処理装置。
- 請求項 1 全文（en、根拠: US12172676B2 の `/en`）: 1. An information processing device comprising: a control unit configured to: acquire biometric information and occupant information of an occupant of a vehicle, estimate state information of the occupant based on the acquired biometric information, compare the estimated state information and the acquired occupant information with past data for another occupant in which the state information and the occupant information are associated with facility information of a service facility used to determine a service facility fit for the occupant, determine information on an autonomous driving state that matches the state information, and provide the information on the autonomous driving state to the vehicle, wherein the estimated state information includes a degree of drowsiness and a degree of fatigue, the occupant information includes a quantity of occupants, the control unit is configured to: determine a first service facility when the state information of the occupant is a first occupant state and the quantity of occupants is a first value, and determine a second service facility when the state information of the occupant is the first occupant state and the quantity of occupants is a second value, propose an accommodation facility including a capsule hotel to an occupant with a high degree of drowsiness and the quantity of less than two, propose the accommodation facility including a family hotel to an occupant with the high degree of drowsiness and the quantity of more than one, propose a healing facility including a massage shop to an occupant with a high degree of fatigue, determine the information on the autonomous driving state as a first autonomous driving state for the occupant with the high degree of drowsiness and the quantity of less than two and for the occupant with the high degree of drowsiness and the quantity of more than one, and determine the information on the autonomous driving state as a second autonomous driving state different from the first autonomous driving state for the occupant with the high degree of fatigue, and the vehicle is configured to execute vehicle control to control the vehicle to drive to the service facility.

### 26. JP7363647B2

- 出願年月: 2020-04
- 出願国・地域: JP, CN, US
- 見出し（ja）: 匿名の車両属性と訪問場所から来訪傾向を集計
- 見出し（en）: Aggregating visit trends by vehicle attributes and place without identifying individuals
- 公報の正式名称（ja）: 情報処理装置、情報処理方法、及び、プログラム
- 請求項 1 全文（ja、根拠: JP7363647B2 の `/ja`）: 複数の車両について、車両に関連付くユーザ個人又は車両個体を特定可能な情報でないが、前記ユーザの属性又は嗜好の少なくとも一部を反映する、前記車両に関する車両情報であって前記車両情報に関連付く複数の属性のうちのいずれかに分類される少なくとも１つのデータを含む車両情報と、前記車両の訪問場所に関する場所情報であって前記場所情報に関連付く複数の属性のうちのいずれかに分類される少なくとも１つのデータを含む場所情報と、を含む第１の情報を取得することと、 前記複数の車両についての前記第１の情報を、前記車両情報に関連付く複数の属性のうちの少なくとも１つの属性と、前記場所情報に関連付く複数の属性のうちの少なくとも１つの属性と、によって集計し、前記車両情報に基づく車両の分類別の、前記車両の訪問場所の傾向を示す傾向情報を取得することと、 を実行する制御部、 を備え、 前記制御部は、 所定の場所に関連する位置に設置されているカメラから取得される情報に基づいて、前記第１の情報を取得し、 前記車両情報を、前記カメラによる撮像画像から取得し、 前記場所情報を、前記カメラが設置されている前記所定の場所に関する情報から取得する、 情報処理装置。
- 請求項 1 全文（en、根拠: US11727418B2 の `/en`）: 1. An information processing apparatus, comprising a controller including at least one processor configured to execute: receiving first information about a plurality of vehicles, the first information being based on information acquired in real-time from a plurality of in-vehicle devices that are respectively mounted on the plurality of vehicles at a predetermined cycle, the first information including vehicle information being associated with at least one piece of data classified as any one of a plurality of attributes about a vehicle, the vehicle information not being capable of identifying an individual user or an individual vehicle but reflecting at least part of attributes or preferences of a user associated with the vehicle, the first information including spot information being associated with at least one piece of data classified as any one of a plurality of attributes about a visit spot of the vehicle, and the first information including time information being associated with at least one piece of data classified as any one of a plurality of attributes about time; receiving the first information based on information acquired from a plurality of cameras installed at a position associated with a predetermined spot at a predetermined cycle, the plurality of cameras include first cameras that are installed in each site of stores and facilities and whose capturing range is a parking lot in the site, and second cameras that are installed along a road and whose capturing range is a part of the road; acquiring the vehicle information from captured images by the plurality of cameras; acquiring the spot information from information about the predetermined spot at which the plurality of cameras is installed; acquiring the first information based on a post on an social networking service (SNS) from a plurality of SNS servers; acquiring the vehicle information from at least one of a message and an image included in the post; acquiring the spot information from at least one of position information and the message included in the post; reforming, into a common format, the vehicle information and the spot information included in the first information which is received from the plurality of in-vehicle devices, the vehicle information acquired from the captured images, the spot information acquired from the information about the predetermined spot, the vehicle information acquired from the at least one of the message and the image, and the spot information acquired from the at least one of the position information and the message, and acquiring the reformed first information including the reformed vehicle information and the reformed spot information; receiving an input of an extraction condition for extracting first information used for totaling, from a user terminal or a display on an operation terminal of the information processing apparatus, the extraction condition being about the vehicle information, the spot information and the time information; extracting the first information satisfying the extraction condition, from the reformed first information about the plurality of vehicles; receiving an input of a totaling condition including specification of an attribute used for totaling, the totaling condition being about the vehicle information and the spot information, from the user terminal or the display on the operation terminal; totaling numbers of records of the first information extracted about the plurality of vehicles according to at least one attribute of the plurality of attributes associated with the vehicle information, at least one attribute of the plurality of attributes associated with the spot information, and at least one attribute of the plurality of attributes associated with the time information, which are specified by the input of the totaling condition received; acquiring second information including the vehicle information about one vehicle, and the spot information about each of a visit spot of a movement source and a visit spot of a movement destination, the second information indicating a history in which the one vehicle has moved from the visit spot of the movement source to the visit spot of the movement destination based on the first information totaled; acquiring tendency information indicating a tendency for a vehicle to move between two visit spots including the visit spot of the movement source and the visit spot of the movement destination, for each classification based on the vehicle information, from the second information about the plurality of vehicles, wherein the tendency information is based at least on a family structure of the user of the vehicle that has been determined based on a number of passengers of the vehicle; receiving an input of an output condition for specifying an output format of the tendency information, from the user terminal or the display on the operation terminal; creating the tendency information in the output format specified by the output condition; and outputting the tendency information created, to the user terminal or the display on the operation terminal, the user terminal or the display on the operation terminal being input the output condition, wherein the plurality of attributes associated with the vehicle information comprises two or more attributes among identification information of a vehicle, a vehicle name, a vehicle body style, a body color, a vehicle model year, and the number of passengers, the number of passengers having been detected by a sensor mounted in the vehicle and transmitted to the information processing apparatus, wherein the plurality of attributes associated with the spot information comprises two or more attributes among identification information of a spot, a position of the spot, and a genre of the spot; wherein the plurality of attributes associated with the time information comprises two or more attributes among a date and time, a year, a month, a day of a week, a time slot, a season, and a staying time; and wherein the controller is further configured to: determine, in the process of extracting the first information, in reaction to the input of the extraction condition, for the vehicle information, the spot information, and the time information related to each of the two visit spots: whether values of the identification information of the vehicle associated with the vehicle information match; whether values of the date and time associated with the time information are within a range of a predetermined length in time; and whether values of the identification information of the spot associated with the spot information are different; and extract the first information, in a case where: the values of the identification information of the vehicle associated with the vehicle information related to the each of the two visit spots match; the values of the date and time associated with the time information related to the each of the two visit spots are within the range of the predetermined length in time; and the values of the identification information of the spot associated with the spot information related to the each of the two visit spots are different.

### 27. JP2021174115A

- 出願年月: 2020-04
- 出願国・地域: JP, CN, US
- 見出し（ja）: 走行と外見情報から生体情報を推測し宿泊サービスを決定
- 見出し（en）: Inferring biometric traits from driving and appearance data to tailor lodging services
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP2021174115A の `/ja`）: 宿泊施設までの一の車両の運転に関連して得られる、前記一の車両の走行情報及び前記一の車両の乗員の外見情報を取得し、取得された前記走行情報及び前記外見情報を、他の車両の運転に関連して過去に得られた前記走行情報及び前記外見情報と比較することで前記一の車両の前記乗員の生体情報を推測し、推測された前記生体情報に適合する、前記宿泊施設におけるサービス提供に関連した第１情報を決定する制御部、 を備える、 情報処理装置。
- 請求項 1 全文（en、根拠: US20210323558A1 の `/en`）: 1. An information processing apparatus comprising: a control unit configured to: acquire traveling information of one vehicle and appearance information of an occupant of the one vehicle, which are obtained in association with driving of the one vehicle to a lodging facility; estimate biological information of the occupant of the one vehicle by comparing the acquired traveling information and the acquired appearance information with traveling information and appearance information previously obtained in association with driving of other vehicles; and determine first information associated with a service provided at the lodging facility, the service being matched with the estimated biological information.

### 28. JP7371562B2

- 出願年月: 2020-04
- 出願国・地域: JP, US, CN
- 見出し（ja）: 同方向に移動する端末同士をグループ化し待合せ場所を提案
- 見出し（en）: Grouping nearby terminals moving the same direction and suggesting a meeting spot
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、及び、プログラム
- 請求項 1 全文（ja、根拠: JP7371562B2 の `/ja`）: 移動中の第１のユーザ端末から所定範囲内に存在し、前記第１のユーザ端末と同じ方面に移動中の、少なくとも１台の第２のユーザ端末を検出した前記第１のユーザ端末から送信される、前記第１のユーザ端末及び前記第２のユーザ端末のそれぞれのユーザをメンバとするコミュニケーショングループの作成を要求するグループ作成要求を受信することと、 前記第１のユーザ端末及び前記第２のユーザ端末のそれぞれのユーザをメンバとする第１のコミュニケーショングループを作成することと、 前記第１のユーザ端末及び前記第２のユーザ端末へ、前記第１のコミュニケーショングループが作成されたことの通知と、前記第１のユーザ端末及び前記第２のユーザ端末のそれぞれのユーザが落ち合う場所を提案するメッセージと、を送信することと、 を実行する制御部、 を備える情報処理装置。
- 請求項 1 全文（en、根拠: US11908033B2 の `/en`）: 1. An information processing system comprising: a server and a user terminal, wherein the server includes a first storage and a first controller connecting with the first storage, wherein the first storage stores user information including an attribute of a user of the user terminal and a Social Networking Service (SNS) account name of the user, a first condition related to a user attribute desired to a member of a communication group by the user, and user identification information identifying the user of the user terminal in association with each other, and the first controller includes at least one processor configured to: receive, from a first user terminal, a group creation request requesting creation of a communication group including respective users of the first user terminal and at least one second user terminal, and user identification information identifying each user of the first user terminal and the at least one second user terminal, the at least one second user terminal existing in a predetermined range from the first user terminal which is moving and moving in the same direction as the first user terminal; acquire an SNS account name corresponding to the user identification information of each user of the first user terminal and the at least one second user terminal based on the received user identification information and the SNS account name which is stored in association with the user identification information in the storage; inquire an SNS server about belonging information indicating whether or not each SNS account name corresponding to the user identification information of the each user of the first user terminal and the at least one second user terminal belongs to the same communication group based on the acquired SNS account name, the SNS server registering communication group of the SNS; acquire the belonging information from the SNS server; determine whether or not the each SNS account name corresponding to the user identification information of the each user of the first user terminal and the at least one second user terminal belongs to the same communication group based on the acquired belonging information; acquire, from the first storage, the user information and a first condition corresponding to the user identification information of the each user of the first user terminal and the at least one second user terminal in a case where the each SNS account name corresponding to the user identification information of the each user of the first user terminal and the at least one second user terminal does not belong to the same communication group; determine for users of the first user terminal and the second user terminal, whether or not pieces of attribute in the acquired user information of the user of the first user terminal satisfy first condition of the user of the second user terminal and pieces of user attribute in the acquired user information of the user of the second user terminal satisfy the first condition of the user of the first user terminal, based on the acquired user information and first condition; withhold to create a first communication group including respective users of the first user terminal and the second user terminal as members in a case where the respective pieces of attribute in the acquired user information do not satisfy the respective first conditions; transmits a permission request requesting permission to create the first communication group to each of the first user terminal and the second user terminal in a case where the respective pieces of attribute in the acquired user information satisfy the respective first conditions; create the first communication group in a case where a permission response indicating the permission to create the first communication group by both the users of the first user terminal and the second user terminal is received from each of the first user terminal and the second user terminal; register the created group in the SNS server; create a suggesting message suggesting a place where the respective users of the first user terminal and the second user terminal meet; and transmit a notification that the first communication group is created and the created suggesting message to the first user terminal and the second user terminal; and the user terminal including a second storage and a second controller connecting with the second storage, wherein the second storage storing a table which stores at least one entry registering duration of continuous reception of a first signal transmitted from at least one second user terminal and second user identification information identifying each user of the at least one second user terminal in association with each other, the at least one second user terminal existing in a predetermined range from a first user terminal of a self-device which is moving and moving in the same direction as the first user terminal, and the second controller configured to: acquire position information of the first user terminal from a Global Positioning System (GPS) receiving unit which receives the position information of the first user terminal, the GPS receiving unit connecting with the first user terminal; acquire a detection value of an acceleration of the first user terminal from an acceleration sensor which detects the detection value of the acceleration of the first user terminal, the acceleration sensor connecting with the first user terminal; determine whether or not the first user terminal is moving, based on change in the acquired position information of the first user terminal and the detection value of the acceleration of the first user terminal; receive, via a terminal communication unit, the first signal transmitted in a predetermined cycle by multicast from the second user terminal by a communication method not using a relay device and the second user identification information, from the at least one second user terminal in a case where the first user terminal is moving; measure the duration of continuous reception of the first signal transmitted from the second user terminal; determine whether or not the received second user identification information is registered in the at least one entry stored in the table; create an entry corresponding to the received second user identification information in the table in a case where the received second user identification information is not registered in the at least one entry; update the duration in an entry corresponding to the received second user identification information in a case where the received second user identification information is registered in the at least one entry; determine whether or not the duration corresponding to the second user identification information in the at least one entry is a predetermined time or more; transmit the group creation request, the first user identification information identifying user of the first user terminal and the second user identification information, to the server, in a case where the duration corresponding to the second user identification information in the at least one entry is a predetermined time or more; receive a notification that the first communication group is created and a suggesting message suggesting a place where the respective users of the first user terminal and the second user terminal meet, from the server; and notify the user of the first user terminal of the notification that the first communication group is created and the suggesting message.

### 29. JP7354888B2

- 出願年月: 2020-03
- 出願国・地域: JP, US, CN
- 見出し（ja）: 運転の丁寧さから車のアバターが雑談を生成
- 見出し（en）: Generating unrelated chit-chat from a car avatar based on driving courtesy
- 公報の正式名称（ja）: 情報処理装置、プログラム、及び、情報処理方法
- 請求項 1 全文（ja、根拠: JP7354888B2 の `/ja`）: 車両の運転者の運転の丁寧さの指標となる運転行動情報を取得することと、 前記車両に関する情報に応じた基本人格が設定されている、前記車両に対応する車両アバターを取得することと、 前記車両に関する情報に応じた基本人格が設定されている車両アバターに対応付けられており、前記運転行動情報の入力に対して前記車両に関する情報及び前記運転行動情報とは関連のない内容のメッセージを生成するように学習済みの学習済みモデルに、前記運転行動情報を入力して、前記車両アバターの基本人格に沿った、前記車両に関する情報及び前記運転行動情報とは関連のない内容のメッセージを取得する ことと、 前記メッセージを前記車両アバターの発言として出力することと、 を実行する制御部、 を備える情報処理装置。
- 請求項 1 全文（en、根拠: US11904868B2 の `/en`）: 1. An information processing device comprising a processor configured to: acquire driving behavior information as an indication of prudence of a driver in driving a vehicle from one or more sensors provided with the vehicle, acquire a vehicle avatar corresponding to the vehicle, the vehicle avatar having a basic personality set thereto according to information about the vehicle, store account information of the vehicle avatar for a predetermined social network service (SNS), acquire a message by the vehicle avatar output from a machine learning model associated with the vehicle avatar by inputting the driving behavior information to the machine learning model, wherein the machine learning model learns the driving behavior information and messages by the vehicle avatar as teacher data and wherein the message output from the machine learning model is not related to the information about the vehicle and the driving behavior information, but reflects the prudence of the driver in driving the vehicle, and post the message on the predetermined SNS using the account information of the vehicle avatar at a predetermined time once per day or a timing of end of traveling, wherein the message is displayed as text uttered by the vehicle avatar and the displayed text is updated based on the prudence of the driver.

### 30. JP7363621B2

- 出願年月: 2020-03
- 出願国・地域: JP, US, CN
- 見出し（ja）: 基準の信頼度が低いと近くの車データで運転逸脱を判定
- 見出し（en）: Acting on a driver when driving deviates from generated reference data past a threshold
- 公報の正式名称（ja）: 情報処理装置、情報処理方法、及び、プログラム
- 請求項 1 全文（ja、根拠: JP7363621B2 の `/ja`）: 車両の周辺の状況または道路状況を取得し、基準となる運転操作のデータである基準データを生成することと、 前記車両の運転者による運転操作のデータである運転データと、前記基準データと、の乖離度が、閾値以上である場合に前記運転者に対して不適切な運転操作の自粛を促すための所定の処理を行うことと、 を実行する制御部を備え、 前記制御部は、前記基準データの信頼度が所定の信頼度未満の場合に、前記所定の処理が行われる対象である対象車両の現在地を通過した他車両から収集した運転操作のデータである他車データに基づいて、前記所定の処理を行うか否か判定する、情報処理装置。
- 請求項 1 全文（en、根拠: US20210291856A1 の `/en`）: 1. An information processing apparatus including a controller configured to execute: obtaining a situation around a vehicle or a road situation, and generating reference data, which is data of a driving operation serving as a reference; and performing predetermined processing when a degree of deviation between driving data, which is data of a driving operation by a driver of the vehicle, and the reference data is equal to or greater than a threshold value.

### 31. JP7294200B2

- 出願年月: 2020-03
- 出願国・地域: JP, US, CN
- 見出し（ja）: 近くの車の状況と嗜好に合わせた画像を選び送信
- 見出し（en）: Sending an image to a nearby vehicle based on its situation and the user's preferences
- 公報の正式名称（ja）: 情報処理装置、車両システム、情報処理方法、およびプログラム
- 請求項 1 全文（ja、根拠: JP7294200B2 の `/ja`）: 第一の車両および第二の車両を含む二台以上の車両の車速、および、前記二台以上の車両のそれぞれが走行する走行車線を表すデータの少なくとも１つを含む走行関連データを取得することと、 前記二台以上の車両の位置関係の推移を複数の状況と関連付けたデータである位置関係データに基づいて、前記第一の車両が、予め定義された複数の状況下のうちのいずれかにあることを判定することと、 前記走行関連データに基づいて、前記第一の車両の近傍に位置し、かつ、前記判定された状況に関連する前記第二の車両を特定することと、 前記第二の車両のユーザに関連付けられた情報端末にインストールされたアプリケーションのリスト、前記情報端末のメッセージの送受信履歴、前記情報端末の位置情報履歴の少なくとも１つを含む端末情報から前記第二の車両に関連づいた嗜好に関する情報である嗜好データを生成することと、 前記判定された状況と、前記嗜好データとに基づいて、前記第二の車両に送信するための画像を決定することと、 前記画像を前記第二の車両に送信することと、 を実行する制御部を有する、情報処理装置。
- 請求項 1 全文（en、根拠: US20210289331A1 の `/en`）: 1. An information processing apparatus, comprising a controller configured to perform: acquiring traveling-related data related to traveling of two or more vehicles including a first vehicle and a second vehicle; determining, based on the traveling-related data, that the first vehicle is in any one of a plurality of predefined situations; identifying, based on the traveling-related data, the second vehicle that is located in a vicinity of the first vehicle and is involved in the determined situation; determining, based on the determined situation and a preference associated with the second vehicle, an image to be transmitted to the second vehicle; and transmitting the image to the second vehicle.

### 32. JP7318576B2

- 出願年月: 2020-03
- 出願国・地域: JP, US, CN
- 見出し（ja）: 他車のハザード履歴から駐停車を推定し最適ルートを決定
- 見出し（en）: Inferring weather and parking activity from another vehicle's wiper and hazard-light use
- 公報の正式名称（ja）: 情報処理装置、情報処理システム、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7318576B2 の `/ja`）: 車両の乗員に対して目的地までの走行ルートを提供する情報処理装置であって、 前記乗員によって設定された前記目的地までの候補ルート上を、前記目的地が設定された第１時点よりも前の第２時点から前記第１時点までの間に走行した他の車両が取得した、該他の車両の走行に関連して得られる走行情報を取得し、取得された前記走行情報に基づいて、前記目的地までの前記車両の運転に対して最適な前記走行ルートを決定する制御部、 を備え、 前記走行情報は、前記他の車両のハザードランプの第２動作情報を含み、 前記制御部は、取得された前記第２動作情報に基づいて前記候補ルート上の駐停車情報を推定し、推定された前記駐停車情報に基づいて、前記目的地までの前記車両の運転に対して最適な前記走行ルートを決定する、 情報処理装置。
- 請求項 1 全文（en、根拠: US12130151B2 の `/en`）: 1. An information processing device that provides a travel route to a destination to an occupant of a first vehicle, the device comprising: a controller configured to: acquire travel information obtained by a second vehicle that travels on a candidate route to the destination set by the occupant from a second point in time prior to a first point in time when the destination is set by the occupant of the first vehicle, the travel information including first operation information on a windshield wiper of the second vehicle, estimate weather information on the candidate route on which the second vehicle travels based on the first operation information on the windshield wiper of the second vehicle, the estimated weather information including information on precipitation and information on humidity, the first operation information on the windshield wiper of the second vehicle having been acquired by the controller from a source external to the information processing device, decide an optimal travel route for driving of the first vehicle to the destination based on the acquired travel information and the estimated weather information, and in a case where the candidate route on which the second vehicle travels is decided as the optimal travel route, decide an operation mode of air conditioning in a vehicle cabin of the first vehicle when the first vehicle travels on the optimal travel route based on the information on the humidity that is estimated based upon the acquired first operation information that is obtained by the second vehicle, wherein the first vehicle is configured to autonomously control itself based upon the optimal travel route and the decided operation mode of the air conditioning, the controller is configured to decide the optimal travel route as a route with more precipitation, the travel information includes second operation information on hazard lights of the second vehicle including a length of time in which the hazard lights remain on, and the controller is configured to: estimate parking and stopping information including whether the second vehicle is parked on the candidate route and whether the second vehicle is parked and stopped on the candidate route based on the acquired second operation information, decide the optimal travel route based on the estimated parking and stopping information, in the case where the candidate route on which the second vehicle travels is decided as the optimal travel route, the controller decides driving information of the first vehicle, including which of a left lane and a right lane to travel in, when the first vehicle travels on the optimal travel route based on the estimated parking and stopping information, and determine the second point in time such that an amount of travel information acquired by the second vehicle from the second point in time to the first point in time is equal to or greater than a predetermined threshold value, the predetermined threshold including an amount of travel information needed when the controller decides the optimal travel route by using the travel information acquired by the second vehicle.

### 33. JP7347276B2

- 出願年月: 2020-03
- 出願国・地域: JP, US, CN
- 見出し（ja）: SNS投稿から洗車機の位置と種類を特定して通知
- 見出し（en）: Identifying car wash location from SNS posts and its type from vehicle sensor data
- 公報の正式名称（ja）: 情報処理装置、及びシステム
- 請求項 1 全文（ja、根拠: JP7347276B2 の `/ja`）: ソーシャルネットワーキングシステムへの投稿から、洗車機に関する投稿を抽出することと、 抽出した前記投稿に基づいて特定される前記洗車機の位置に関する情報及び前記洗車機の種類に関する情報を、前記ソーシャルネットワーキングシステムを利用するユーザの端末に送信することと、 を実行する制御部を備える情報処理装置であって、 所定のキーワードと、前記洗車機の種類との関係を記憶する記憶部を更に備え、 前記制御部は、 前記抽出した投稿に紐づけられた位置情報を前記洗車機の位置に関する情報として特定し、 前記抽出した投稿に含まれる前記所定のキーワードと、前記記憶部に記憶されている関係とに基づいて、前記洗車機の種類を特定する、 情報処理装置。
- 請求項 1 全文（en、根拠: US11553052B2 の `/en`）: 1. An information processing apparatus including a controller configured to perform: extracting a post related to a vehicle washing machine from posts to a social networking service; and transmitting, to a terminal of a user using the social networking service, information on a position of the vehicle washing machine and information on a type of the vehicle washing machine specified based on the post thus extracted, the information processing apparatus further comprising: a non-transitory storage medium configured to store a relation between data detected by a sensor mounted on a vehicle associated with the user and the type of the vehicle washing machine; wherein the controller specifies the type of the vehicle washing machine based on the data detected by the sensor mounted on the vehicle corresponding to the extracted post, wherein the non-transitory storage medium further stores a relation between the data detected by the sensor mounted on the vehicle and an evaluation of the vehicle washing machine, and the controller transmits the evaluation of the vehicle washing machine based on the data detected by the sensor to the terminal of the user.

### 34. JP7298526B2

- 出願年月: 2020-03
- 出願国・地域: JP, US, CN
- 見出し（ja）: 車車間通信で近くの車の再生中の音楽情報を共有
- 見出し（en）: Sharing currently playing music between nearby vehicles via inter-vehicle communication
- 公報の正式名称（ja）: 情報処理装置、プログラム、及び、方法
- 請求項 1 全文（ja、根拠: JP7298526B2 の `/ja`）: 車両内に存在可能な情報処理装置であって、 周辺に存在する１又は複数の車両のうちの対象車両について、車両内で再生中の音楽に関する第１の情報の取得要求と前記対象車両に関する情報とを、車車間通信を通じて、マルチキャスト又はブロードキャストで、前記周辺に存在する１又は複数の車両へ送信することと、 前記対象車両内に存在し、前記対象車両についての前記第１の情報を有する第１の情報処理装置から、前記車車間通信を通じて、前記対象車両についての前記第１の情報を受信することと、 前記対象車両についての前記第１の情報を出力することと、 前記周辺に存在する１又は複数の車両のうちのいずれかに存在している第２の情報処理装置から、前記第２の情報処理装置の対象車両に関する情報と、前記第２の情報処理装置の対象車両についての前記第１の情報の取得要求と、を受信することと、 前記第２の情報処理装置の対象車両に関する情報が、前記情報処理装置が存在している第１の車両を示す場合に、前記第１の車両についての前記第１の情報を前記第２の情報処理装置へ送信することと、 を実行する制御部、 を備える情報処理装置。
- 請求項 1 全文（en、根拠: US11606676B2 の `/en`）: 1. An information processing device capable of being placed inside a first vehicle, the information processing device comprising a controller configured to: transmit an acquisition request for information about music that is being played back in a vehicle, in relation to a second vehicle among one or a plurality of vehicles existing in a periphery through inter-vehicle communication, by multicast or broadcast; receive, through the inter-vehicle communication, first information about music that is being played back in the second vehicle from a first information processing device that is placed inside the second vehicle; output the first information; transmit information about the second vehicle, together with the acquisition request related to the second vehicle; receive, from a second information processing device, information about a target vehicle of the second information processing device and the acquisition request related to the target vehicle of the second information processing device; and transmit, to the second information processing device, the second information about music that is being played back in the first vehicle where the information processing device is placed, in a case where the information about the target vehicle of the second information processing device indicates the first vehicle.

### 35. JP7371520B2

- 出願年月: 2020-02
- 出願国・地域: JP, CN, US
- 見出し（ja）: 加速車線の合流地点で前後の車に合流案内を出す
- 見出し（en）: Guiding a merging vehicle and the vehicle behind it at an acceleration lane's end
- 公報の正式名称（ja）: 情報処理装置、情報処理方法、及び、プログラム
- 請求項 1 全文（ja、根拠: JP7371520B2 の `/ja`）: 加速車線を走行する第１の車両の本線における割り込み位置の後方を走行する第２の車両を特定することと、 （１）前記第１の車両へ、前記加速車線の先端において前記第１の車両の本線への合流を促す第１の案内を通知すること、又は、（２）前記第１の車両へ前記第１の案内を通知すること、及び、前記第２の車両へ、前記第１の車両の本線への合流の支援を促す第２の案内を通知すること、と、 を実行する制御部、 を備え、 前記制御部は、 前記第１の車両が前記加速車線の先端を含む合流エリアに進入したことを検出した場合に、前記第１の案内を通知し、 前記第１の車両が前記加速車線上の前記合流エリアの手前を走行している場合に、前記第１の車両へ、前記本線への合流の待機の案内を通知する、 情報処理装置。
- 請求項 1 全文（en、根拠: US20210256851A1 の `/en`）: 1. An information processing apparatus, comprising a controller configured to: identify a second vehicle traveling on a main lane behind a cutting-in position at which a first vehicle traveling on an acceleration lane cuts in; and perform at least any one of notifying the first vehicle of first guidance that prompts the first vehicle to merge into the main lane at a far end of the acceleration lane, and notifying the second vehicle of second guidance that prompts the second vehicle to assist the first vehicle in merging into the main lane.

### 36. JP7310636B2

- 出願年月: 2020-02
- 出願国・地域: JP, US, CN
- 見出し（ja）: 並走時は閾値を下げ相対速度の反転回数超過で所定処理
- 見出し（en）: Switching to autonomous driving on frequent speed-sign reversals with a nearby vehicle
- 公報の正式名称（ja）: 情報処理装置、情報処理方法、およびプログラム
- 請求項 1 全文（ja、根拠: JP7310636B2 の `/ja`）: 同一の道路を走行中である二台の車両の相対距離および相対速度を周期的に取得することと、 前記相対距離が第二の閾値を下回り、前記二台の車両が並走または縦列している状況下において、第一の期間において発生した前記相対速度の正負反転の回数が第一の閾値を超えた場合に、所定の処理を行うことと、 を実行する制御部を有し、 前記制御部は、前記二台の車両が並走している場合において、前記二台の車両が縦列している場合と比較して前記第一の閾値をより小さくする、 情報処理装置。
- 請求項 1 全文（en、根拠: US11912276B2 の `/en`）: 1. An information processing apparatus comprising: a controller configured to execute: periodically acquiring relative speed between two vehicles which are traveling on a same road; and performing predetermined processing in a case where a number of times that a polarity of the relative speed is inverted in a first period exceeds a first threshold, wherein the predetermined processing includes causing at least one of the two vehicles to switch from manual driving to autonomous driving in the case where the number of times that the polarity of the relative speed is inverted in the first period exceeds the first threshold, the controller is configured to determine the first threshold on a basis of positional relationship between the two vehicles, and the controller is configured to set the first threshold smaller in a case where the two vehicles are traveling side by side than in a case where the two vehicles are traveling in single file.

### 37. JP7347227B2

- 出願年月: 2020-01
- 出願国・地域: JP, CN, US
- 見出し（ja）: 同一車線の後続車接近を検知し車線変更を案内
- 見出し（en）: Detecting a same-lane vehicle approaching from behind and guiding a lane change
- 公報の正式名称（ja）: 情報処理装置、及び、情報処理方法
- 請求項 1 全文（ja、根拠: JP7347227B2 の `/ja`）: 車両に搭載される情報処理装置であって、 前記車両と後方車両とが同じ車線上を走行しているか否かを検出することと、 外部装置に、取得した前記車両の位置情報とともに問い合わせを送信して、前記外部装置から前記車両の走行車線の種類を取得することと、 前記後方車両に関する情報を、車々間通信、車載センサ、または車載カメラを介して取得することと、 前記後方車両に関する情報が、車々間通信、車載センサ、および車載カメラのいずれによって取得されたかに応じて、異なる方法を用いて、前記後方車両が前記車両の速度よりも速い速度で接近しているか否かを判定することと、 前記車両と前記後方車両とが同じ車線上を走行しており、前記後方車両が前記車両の速度よりも速い速度で接近している場合において、前記車両が交差点付近に位置しておらず、かつ、前記車両が走行している道路が２車線以上であることを条件として、 車線変更の案内を出力することと、 を実行する制御部を備える、 情報処理装置。
- 請求項 1 全文（en、根拠: US11891079B2 の `/en`）: 1. An information processing apparatus mounted on a vehicle, the information processing apparatus comprising a controller configured to: detect whether or not the vehicle and a following vehicle are traveling on a same lane, acquire position information of the vehicle, transmit an inquiry to an external device together with the position information of the vehicle, and acquire a type of a traveling lane of the vehicle from the external device, acquire information about the following vehicle via vehicle-to-vehicle communication, a vehicle-mounted sensor, or a vehicle-mounted camera, determine whether or not the following vehicle is approaching at a speed faster than a speed of the vehicle with a different method according to which of the vehicle-to-vehicle communication, the vehicle-mounted sensor, and the vehicle-mounted camera acquires the information about the following vehicle, and output a guidance to change lanes on a condition that the vehicle being not close to an intersection and that a road where the vehicle is travelling having two or more lanes, in a case where the vehicle and the following vehicle are traveling on the same lane, and the following vehicle is approaching at a speed faster than the speed of the vehicle.

### 38. JP7287291B2

- 出願年月: 2020-01
- 出願国・地域: JP, CN, US
- 見出し（ja）: 危険運転時にエンジン出力を落とし音は通常のまま聞かせる
- 見出し（en）: Reducing engine output during risky driving while playing normal-sounding engine noise
- 公報の正式名称（ja）: 情報処理装置、プログラム、及び、情報処理方法
- 請求項 1 全文（ja、根拠: JP7287291B2 の `/ja`）: 車両に搭載される情報処理装置であって、 前記車両の運転者が危険運転をしているか否かを判定することと、 前記車両の運転者が危険運転をしていると判定する場合には、前記車両に搭載されている機関の出力を、アクセルペダルのストローク量に基づく第１の情報に応じて決定される通常時の第１の値よりも小さい第２の値に決定する第１の制御処理を行うことと、 を実行する制御部、 を備え、 前記制御部は、 前記第１の制御処理において、前記機関の出力が前記第１の値でなされているように前記運転者に聞こえるような音量で、前記機関の出力によって発生する音の音声データを前記車両に備えられるスピーカから出力させる、 情報処理装置。
- 請求項 1 全文（en、根拠: US11904879B2 の `/en`）: 1. An information processing apparatus to be mounted on a vehicle, the information processing apparatus comprising: a controller configured to: determine whether or not a driver of the vehicle is driving dangerously, and perform, when it is determined that the driver of the vehicle is driving dangerously, a first control process of determining a second value of output of a machine mounted on the vehicle according to first information based on a first stroke amount of an accelerator pedal and outputting the second value to the machine to cause the machine to output at the second value, wherein the second value of the output of the machine is smaller than a first value of the output of the machine that is determined according to the first information based on the first stroke amount of the accelerator pedal when it is determined that the driver of the vehicle is not driving dangerously, the second value of the output of the machine and the first value of the output of the machine both correspond to the same first stroke amount, in the first control process, the controller acquires position information on the vehicle, determines a road where the vehicle is traveling is an expressway or a local road based on the position information, and determines the second value of the output of the machine in such a way that the second value of the output of the machine is greater in a case where the road where the vehicle is traveling is the expressway than in a case where the road where the vehicle is traveling is the local road, and in the first control process, when the driver treads the accelerator pedal by the first stroke amount and the output of the machine is the second value, the controller causes audio data of sound that is generated by the output of the machine at the second value to be output from a speaker provided in the vehicle at a volume that is the same as when the driver treads the accelerator pedal by the first stroke amount and the output of the machine is the first value.

### 39. JP2021117615A

- 出願年月: 2020-01
- 出願国・地域: JP, US, CN
- 見出し（ja）: 周辺車両の運転傾向と比較し逸脱時に運転者へ通知
- 見出し（en）: Comparing a driver's tendencies to nearby vehicles' aggregate and alerting on deviation
- 公報の正式名称（ja）: 情報処理装置、情報処理方法、およびプログラム
- 請求項 1 全文（ja、根拠: JP2021117615A の `/ja`）: 第一の車両の運転傾向を表す第一のデータを取得することと、 前記第一の車両の近傍に位置する第二の車両の運転傾向を表す第二のデータを取得することと、 複数の前記第二の車両に対応する前記第二のデータを集約し、基準データを生成することと、 前記第一のデータと前記基準データとの類似度を算出し、所定値以上の乖離があった場合に、前記第一の車両の運転者に通知することと、 を実行する制御部を有する、情報処理装置。
- 請求項 1 全文（en、根拠: US20210233398A1 の `/en`）: 1. An information processing apparatus having a controller comprising at least one processor configured to perform: obtaining first data representing a driving tendency of a first vehicle; obtaining second data representing a driving tendency of each second vehicle located in the vicinity of the first vehicle; aggregating the second data corresponding to a plurality of the second vehicles thereby to generate reference data; and calculating a degree of similarity between the first data and the reference data thereby to make a notification to a driver of the first vehicle when there is a deviation of a predetermined value or more between the first data and the reference data.

### 40. JP7200645B2

- 出願年月: 2018-12
- 出願国・地域: JP, US, CN
- 見出し（ja）: 乗員を車外の風景に合成した写真を作る車載カメラ
- 見出し（en）: In-vehicle cameras that composite a passenger onto the outside scenery
- 公報の正式名称（ja）: 車載装置、プログラム、及び車両
- 請求項 1 全文（ja、根拠: JP7200645B2 の `/ja`）: 車室内を背景として乗員を含む被写体を撮像し第１の撮像画像を生成する第１の車載カメラと、 車外風景を撮像し第２の撮像画像を生成する第２の車載カメラと、 前記第１の撮像画像から前記被写体の画像を抽出し、前記第２の撮像画像の前記車外風景の画像を背景として前記被写体の画像が配置された合成画像を生成する画像処理部と、 を有する車載装置。
- 請求項 1 全文（en、根拠: US11057575B2 の `/en`）: 1. An in-vehicle device comprising: a first in-vehicle camera configured to capture a subject in a cabin of a vehicle to create a first captured image; a second in-vehicle camera configured to capture an outside scene to create a second captured image; and an image processing unit configured to create, from the first and second captured images, a composite image in which the first captured image is processed so that only the subject, which is located in the cabin of the vehicle and not part of the cabin of the vehicle, is extracted from the first captured image and the outside scene in the second captured image is superimposed thereon so that the subject is arranged with the outside scene as a background, wherein the first captured image includes a subject image consisting of at least one of a user and a passenger located in the cabin of the vehicle.

### 41. JP2020093622A

- 出願年月: 2018-12
- 出願国・地域: JP, US, CN
- 見出し（ja）: 乗員を撮像認識し車の装備設定を他の車にも復元
- 見出し（en）: Recognizing an occupant's image to restore vehicle equipment settings in any car
- 公報の正式名称（ja）: 制御システム、サーバ、車載制御装置、車両、及び制御方法
- 請求項 1 全文（ja、根拠: JP2020093622A の `/ja`）: 互いに情報を送受信する車載制御装置とサーバとを有する制御システムにおいて、 前記車載制御装置は、 乗員の撮像画像を取得する画像取得部と、 車両の装備の設定状態を取得する設定状態取得部と、 前記撮像画像または当該撮像画像から検出される前記乗員の識別情報と前記設定状態とを前記サーバに送信する送信部とを有し、 前記サーバは、 前記乗員と前記設定状態とを対応付けた設定情報を記憶する記憶部と、 前記設定情報が記憶された後、前記車載制御装置または他の車載制御装置にて前記乗員が撮像されると、当該乗員に対応づけられた前記設定状態を当該車載制御装置または当該他の車載制御装置に送信する送信部とを有する、 制御システム。
- 請求項 1 全文（en、根拠: US20200180533A1 の `/en`）: 1. A control system comprising: an in-vehicle control device; and a server that are configured to transmit and receive information to and from each other, wherein the in-vehicle control device includes an image acquisition unit configured to acquire a captured image of an occupant, a setting state acquisition unit configured to acquire a setting state of equipment of a vehicle, and a transmission unit configured to transmit, to the server, the captured image or identification information regarding the occupant detected from the captured image, and the setting state, and the server includes a storage unit configured to store setting information in which the setting state and the occupant are associated with each other, and a transmission unit configured to transmit the setting state associated with the occupant to the in-vehicle control device or another in-vehicle control device when an image of the occupant is captured in the in-vehicle control device or the other in-vehicle control device after the setting information is stored in the storage unit.

### 42. JP7218557B2

- 出願年月: 2018-12
- 出願国・地域: JP, US, CN
- 見出し（ja）: 乗用旅客車両のカメラから他車の空車情報を検出し配信
- 見出し（en）: Detecting an empty passenger vehicle from a camera and sending its location
- 公報の正式名称（ja）: サーバ、車載装置、プログラム、情報提供システム、情報提供方法、及び車両
- 請求項 1 全文（ja、根拠: JP7218557B2 の `/ja`）: 第１の乗用旅客車両に搭載され撮像機能を有する車載装置、及び携帯端末と情報を送受信する通信部と、 前記車載装置の位置と当該車載装置による第２の乗用旅客車両の撮像画像とに基づき導出される、空車である前記第２の乗用旅客車両の位置を含む空車情報を格納する記憶部と、 前記携帯端末から取得する当該携帯端末の位置に対応する空車の位置を有する前記空車情報を、前記携帯端末に送出する情報提供部と、 を有するサーバ。
- 請求項 1 全文（en、根拠: US20200184237A1 の `/en`）: 1. A server comprising: a communication unit configured to transmit and receive information to and from an in-vehicle device that has a capturing function and a portable terminal; a storage unit configured to store empty vehicle information including a location of an empty vehicle based on a location of the in-vehicle device and a captured image of a vehicle for passengers captured by the in-vehicle device; and an information providing unit configured to transmit, to the portable terminal, the empty vehicle information including a location of an empty vehicle corresponding to a location of the portable terminal acquired from the portable terminal.

### 43. JP7192443B2

- 出願年月: 2018-11
- 出願国・地域: JP, US, CN
- 見出し（ja）: 車載カメラの画像から道路障害物の除去時間を推定し配信
- 見出し（en）: Estimating road obstacle removal time from vehicle camera images and sharing it
- 公報の正式名称（ja）: 情報提供システム、サーバ、車載装置、車両、プログラム及び情報提供方法
- 請求項 1 全文（ja、根拠: JP7192443B2 の `/ja`）: サーバと、前記サーバと情報を送受信する車載装置とを有する情報提供システムにおいて、 前記車載装置は、 車両周辺を撮像する撮像部と、 位置情報と撮像画像データとを前記サーバに送信する第１の送信部とを有し、 前記サーバは、 前記撮像画像データに基づいて、路上に設置される標識から所定の方向で所定の距離範囲内にある路上障害物の位置と当該路上障害物の除去にかかる予測時間とを含む除去状況情報を生成する除去状況情報生成部と、 前記除去状況情報を送信する第２の送信部とを有し、 前記サーバから送信される前記除去状況情報が他の車載装置にて出力される、 情報提供システム。
- 請求項 1 全文（en、根拠: US11631326B2 の `/en`）: 1. An information providing system comprising: a server; an onboard device configured to transmit and receive information to and from the server, wherein the onboard device includes an imaging unit configured to capture an image around a vehicle and a first transmission unit configured to transmit position information and captured image data to the server, wherein the server includes circuitry configured to: determine a type of a road obstacle and a removal state of the road obstacle based on the captured image data, calculate a predicted time that is required to remove the road obstacle based on the type of the road obstacle and the removal state of the road obstacle, and generate removal state information including the predicted time; and a second transmission unit configured to transmit the removal state information, wherein the road obstacle includes at least one object that is not operable and is incapable of moving on its own, wherein the type of the road obstacle includes a type of the at least one object that is not operable and is incapable of moving on its own, and wherein the removal state of the road obstacle includes one of a plurality of progress levels of removal of the road obstacle, and wherein the removal state information which is transmitted from the server is output in another onboard device.

### 44. JP7087966B2

- 出願年月: 2018-11
- 出願国・地域: JP, US, CN
- 見出し（ja）: 動力源価格の表示形式を統一し近くの補給所を推薦
- 見出し（en）: Prioritizing nearby power-source stations by photo-extracted price, based on output mode
- 公報の正式名称（ja）: 情報提供システム、サーバ、車載装置及び情報提供方法
- 請求項 1 全文（ja、根拠: JP7087966B2 の `/ja`）: 車載装置と、前記車載装置と情報を送受信するサーバとを有する情報提供システムにおいて、 前記車載装置は、 現在位置及び出力モードを取得して前記サーバに送信する条件設定部と、 前記サーバから受信する動力源補給所推薦情報を出力する出力部と を有し、 前記サーバは、 動力源補給所の位置情報と当該動力源補給所の撮像画像から検出される動力源価格とを含む動力源補給所情報と、異なるパターンで表現される前記動力源価格を一律の単位料金に変換するための情報とを記憶する記憶部と、 前記現在位置から所定の範囲内に位置する動力源補給所に前記出力モードに応じた優先順位付けをし、当該優先順位付けされた動力源補給所の動力源補給所情報を前記動力源価格が前記一律の単位料金で表現される動力源補給所推薦情報として前記車載装置に提供する、動力源補給所推薦情報提供部と、 を有する 情報提供システム。
- 請求項 1 全文（en、根拠: US10856104B2 の `/en`）: 1. An information providing system comprising an onboard device and a server configured to transmit information to and receive information from the onboard device, wherein the onboard device includes: one or more first processors configured to acquire a current position and an output mode and to transmit the acquired current position and the acquired output mode to the server; and an output interface configured to output recommendation information of a power source station which is received from the server, and the server includes: one or more memories configured to store information of the power source station including position information of the power source station and a power source price which is detected from a captured image of the power source station; and one or more second processors configured to prioritize power source stations which are located within a predetermined range from the current position based on the output mode and to provide information of the prioritized power source stations as the recommendation information of the power source station to the onboard device, receive the captured image data from a mobile terminal, extract the power source price information from the captured image data which is received from the mobile terminal, and generate the information of the power source station including the power source price information and position information corresponding to the captured image data.

### 45. JP7251120B2

- 出願年月: 2018-11
- 出願国・地域: JP, US, CN
- 見出し（ja）: 低加速の危険車両を検知し周辺車両に位置を警告
- 見出し（en）: Warning nearby vehicles about a dangerous vehicle reported from a safely-driving vehicle
- 公報の正式名称（ja）: 情報提供システム、サーバ、車載装置、プログラム及び情報提供方法
- 請求項 1 全文（ja、根拠: JP7251120B2 の `/ja`）: サーバと、前記サーバと情報を送受信する車載装置とを有する情報提供システムにおいて、 第１の車両の前記車載装置は、 周辺車両を撮像する撮像部と、 前記周辺車両の撮像画像を含む周辺車両情報、前記第１の車両の加速度の情報、及び前記車載装置の位置情報を前記サーバに送信する第１の送信部とを有し、 前記サーバは、 前記第１の車両の加速度が基準以下であることを条件として前記周辺車両情報から危険挙動を呈する危険車両を検出し、当該危険車両の周辺の複数の第２の車両への当該第２の車両に対する前記危険車両の位置を含む警告情報を生成する警告部と、 前記警告情報を前記第２の車両それぞれへ送信する第２の送信部と、 を有する情報提供システム。
- 請求項 1 全文（en、根拠: US11176826B2 の `/en`）: 1. An information providing system comprising: a server; and an onboard device configured to transmit and receive information to and from the server, wherein the onboard device includes an imager configured to image a nearby vehicle and a first transmitter configured to transmit nearby vehicle information including a captured image of the nearby vehicle or dangerous vehicle information including a position of a dangerous vehicle which is detected from the nearby vehicle information and position information of the onboard device to the server, wherein the server includes a controller configured to generate warning information including the position of the dangerous vehicle for a vehicle near the dangerous vehicle and a second transmitter configured to transmit the warning information, wherein the dangerous vehicle information further includes information regarding a type of dangerous vehicle behavior exhibited by the dangerous vehicle, the dangerous vehicle behavior includes a behavior that potentially shortens a distance between the dangerous vehicle and the vehicle near the dangerous vehicle and a behavior that potentially causes contact between the dangerous vehicle and the vehicle near the dangerous vehicle, the onboard device includes a dangerous vehicle detector configured to detect whether a host vehicle on which the onboard device is install is performing dangerous driving, and to detect the dangerous vehicle information of the dangerous vehicle from the nearby vehicle information, and the dangerous vehicle detector is configured to detect the dangerous vehicle information in a case that the dangerous vehicle detector has determined that the host vehicle on which the onboard device is installed does not perform dangerous driving.

### 46. JP7206854B2

- 出願年月: 2018-11
- 出願国・地域: JP, US, CN
- 見出し（ja）: 同じ危険地点でも利用者ごとに異なる警告態様で出力
- 見出し（en）: Sending hazard info only when its recorded time matches the requester's current time
- 公報の正式名称（ja）: 情報提供システム、サーバ、携帯端末、プログラム及び情報提供方法
- 請求項 1 全文（ja、根拠: JP7206854B2 の `/ja`）: 相互に情報を送受信する車載装置、サーバ及び携帯端末を有する情報提供システムにおいて、 前記車載装置は、 車両周辺を撮像する撮像部と、 位置情報、車両状態情報及び撮像画像データを前記サーバに送信する第１の送信部とを有し、 前記サーバは、 前記車両状態情報及び撮像画像データに基づいて前記位置情報に対応する危険度を有する危険地点情報を生成する危険地点情報生成部と、 前記携帯端末の位置情報に対応する危険地点情報を送信する第２の送信部とを有し、 前記携帯端末は、 位置情報を前記サーバに送信する第３の送信部と、 前記危険地点情報を受信する受信部と、 前記危険地点情報に基づく警告を出力するとき、前記携帯端末のユーザに応じた異なる動作モードでは同じ地点における前記危険地点情報であっても異なる出力態様で出力する出力部とを有する、 情報提供システム。
- 請求項 1 全文（en、根拠: US10937319B2 の `/en`）: 1. An information provision system having a vehicle-mounted device, a server, and a mobile terminal, which send and receive information to and from one another, wherein: the vehicle-mounted device has an imaging unit that captures an image of a vicinity of a vehicle, and a first transmitting unit that sends position information, vehicle condition information, and captured image data, to the server; the server has a dangerous spot information creating unit that creates dangerous spot information having a danger level and associated with the position information, based on the vehicle condition information and the captured image data, and a second transmitting unit that sends the dangerous spot information to the mobile terminal; and the mobile terminal has a third transmitting unit that sends position information of the mobile terminal to the server, a receiving unit that receives the dangerous spot information corresponding to the position information of the mobile terminal, and an output unit that outputs a warning based on the dangerous spot information, wherein the first transmitting unit further sends an imaging time of the captured image data to the server, wherein the dangerous spot information creating unit includes the imaging time in the dangerous spot information, wherein the third transmitting unit further sends a current time to the server, and wherein the second transmitting unit sends the dangerous spot information corresponding to the current time.

### 47. US20250199754A1

- 出願年月: 2023-12
- 出願国・地域: US, CN
- 見出し（ja）: 車内騒音レベルに応じて音声案内の音量を自動調整（`titleJaProvisional: true`）
- 見出し（en）: Adjusting voice guidance volume to match the detected in-cabin noise level
- 公報の正式名称（ja）: Voice guidance apparatus、車両、non-transitory computer readable medium
- 請求項 1（ja）: なし（JP 代表公報が無いため。見出し（ja）は英語の請求項だけを根拠にした二次的な要約）
- 請求項 1 全文（en、根拠: US20250199754A1 の `/en`）: 1. A voice guidance apparatus comprising a controller configured to: accept a setting for volume of voice guidance to be output in a vehicle for each volume level of a noise that may be detected in the vehicle; and adjust, upon detecting a noise in the vehicle when outputting the voice guidance, the volume of the voice guidance to set volume corresponding to a volume level of the detected noise.

### 48. US20250146351A1

- 出願年月: 2023-11
- 出願国・地域: US, CN
- 見出し（ja）: 座席の乗員属性に応じてパワーウィンドウ設定を自動適用（`titleJaProvisional: true`）
- 見出し（en）: Automatically applying power window settings based on the seated occupant's attributes
- 公報の正式名称（ja）: 情報処理装置
- 請求項 1（ja）: なし（JP 代表公報が無いため。見出し（ja）は英語の請求項だけを根拠にした二次的な要約）
- 請求項 1 全文（en、根拠: US20250146351A1 の `/en`）: 1. An information processing apparatus comprising a controller configured to: store attribute information for an occupant who may board a vehicle and setting information for a power window to correspond with each other; acquire attribute information for an occupant seated in a seat of the vehicle; and control driving of a power window corresponding to the seat using setting information corresponding to the acquired attribute information.

### 49. JP2025096041A

- 出願年月: 2023-12
- 出願国・地域: JP
- 見出し（ja）: 指定区間を避けた代替経路を再探索して表示
- 見出し（en）: Re-searching and displaying an alternate route that avoids a user-specified segment
- 公報の正式名称（ja）: 方法
- 請求項 1 全文（ja、根拠: JP2025096041A の `/ja`）: 入力部と、出力部と、制御部とを備える端末装置が実行する方法であって、 前記制御部が、 経路探索によって探索された、目的地までの経路である第１の経路を、前記出力部を介して表示することと、 前記第１の経路の一部区間を指定するユーザ入力を、前記入力部を介して受け付けることと、 経路探索によって探索された、前記目的地までの経路であって前記一部区間を避けた経路である第２の経路を、前記出力部を介して表示することと を含む、方法。
- 見出し（en）もこの日本語の請求項（JP2025096041A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 50. JP2025097162A

- 出願年月: 2023-12
- 出願国・地域: JP
- 見出し（ja）: 運転者はナビ、同乗者は経路編集を同時表示する車載機
- 見出し（en）: An in-vehicle display showing navigation to the driver and route editing to the passenger
- 公報の正式名称（ja）: 車載装置
- 請求項 1 全文（ja、根拠: JP2025097162A の `/ja`）: 車両内に設けられる車載装置であって、 運転席に向けて表示する第１画像、および、助手席に向けて表示する第２画像を表示可能なディスプレイと、 前記運転席の側に設けられ前記第１画像に対する操作を受け付ける第１操作部と、 前記助手席の側に設けられ前記第２画像に対する操作を受け付ける第２操作部と、 前記ディスプレイに表示される前記第１画像、および、前記第２画像を生成する制御部と を備え、前記制御部は、前記車両の走行中に前記第１画像として走行経路を案内するナビゲーション画面を表示しているとき、前記第２画像として走行経路の編集画面を表示し、前記第２操作部による操作を受け付ける、車載装置。
- 見出し（en）もこの日本語の請求項（JP2025097162A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 51. JP2025096045A

- 出願年月: 2023-12
- 出願国・地域: JP
- 見出し（ja）: 障害物に接触する開度未満に制限してドアを開く制御
- 見出し（en）: Limiting a door opening angle below the point where it would contact obstacles
- 公報の正式名称（ja）: 制御装置
- 請求項 1 全文（ja、根拠: JP2025096045A の `/ja`）: 車両又は携帯端末に設けられたユーザインタフェースを介して、ユーザにより指定された前記車両のドア及びその開度を示すデータを取得すると、前記開度まで開くよう前記ドアを制御する制御部であって、前記ドアの、前記車両の周辺に存在する障害物と接触し得る最小開度を閾値として設定し、前記閾値を下回る範囲で前記開度の指定を受け付けるよう前記ユーザインタフェースを制御する制御部を備える制御装置。
- 見出し（en）もこの日本語の請求項（JP2025096045A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 52. JP2025097160A

- 出願年月: 2023-12
- 出願国・地域: JP
- 見出し（ja）: 経路探索済みの端末を車両が選んで経路情報を取得
- 見出し（en）: A vehicle selecting and connecting to the terminal that already searched a route
- 公報の正式名称（ja）: 方法
- 請求項 1 全文（ja、根拠: JP2025097160A の `/ja`）: 近距離無線通信可能な複数の端末装置と、車両と、を備えるシステムが実行する方法であって、 前記複数の端末装置のそれぞれにより、 自機の識別情報と、自機が経路探索を実行済みであるか否かを示す属性情報と、を含む信号を前記車両に送信することと、 前記車両により、 前記複数の端末装置のそれぞれから前記信号を受信し、前記識別情報に基づいて、前記複数の端末装置のうち、経路探索を実行済みである１つの端末装置と接続することと、 前記１つの端末装置から、前記１つの端末装置において実行済みの経路探索に関する情報を受信することと、 を含む、方法。
- 見出し（en）もこの日本語の請求項（JP2025097160A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 53. JP2024007891A

- 出願年月: 2022-07
- 出願国・地域: JP
- 見出し（ja）: スマートキー連携で荷物を屋内に届け再施錠する車両
- 見出し（en）: A delivery vehicle that unlocks a smart-key door to place packages inside and re-locks
- 公報の正式名称（ja）: 車両
- 請求項 1 全文（ja、根拠: JP2024007891A の `/ja`）: 荷物の配送を自律的に行う信頼性を有する車両であって、 配送先の自宅のドアに用いられるスマートキーと連携して前記ドアを開錠し、前記荷物を前記自宅の中に置くと、前記ドアを施錠して前記荷物の配送を完了させるように前記車両を制御する制御部、 を備え、 前記制御部は、前記車両の周囲に人がいると判定すると、前記ドアの開錠処理を前記車両に中断させる、 車両。
- 見出し（en）もこの日本語の請求項（JP2024007891A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 54. JP2024007895A

- 出願年月: 2022-07
- 出願国・地域: JP
- 見出し（ja）: 配送経路の勾配が許容超なら代替策を選ぶ配送車両
- 見出し（en）: A delivery vehicle that finds alternatives when a route's slope exceeds cargo limits
- 公報の正式名称（ja）: 車両
- 請求項 1 全文（ja、根拠: JP2024007895A の `/ja`）: 荷物の置き配が可能な車両であって、 前記荷物の配送ルートを判定すると、前記配送ルートの斜度と、前記荷物につき事前に設定された許容斜度とを比較し、 前記配送ルートの斜度が前記許容斜度を超えると判定すると、 配送せずに前記荷物を一旦預かることと、 前記配送ルートの周辺で前記許容斜度を超えない代替ルートを検索して、前記代替ルートを発見できれば、前記代替ルートを利用して配送することと、 前記配送ルートのうち前記許容斜度を超える位置が配送先のみである場合、前記荷物を水平に置くことができる台を前記配送先に設置して、前記台の上に前記荷物を配送することと、 配送可能な能力を有する他の配送モビリティに配送指示を送信することと、 の少なくとも１つを決定する、車両。
- 見出し（en）もこの日本語の請求項（JP2024007895A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 55. JP2024004360A

- 出願年月: 2022-06
- 出願国・地域: JP
- 見出し（ja）: 返却情報の指定位置で収容ボックスを回収する車両
- 見出し（en）: A vehicle that collects a delivery box at a location specified in return information
- 公報の正式名称（ja）: 車両
- 請求項 1 全文（ja、根拠: JP2024004360A の `/ja`）: 荷物の置き配が可能な車両であって、 前記荷物の収容ボックスについての返却情報を受信すると、前記返却情報において指定された位置で前記収容ボックスを回収する、車両。
- 見出し（en）もこの日本語の請求項（JP2024004360A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 56. JP2023183846A

- 出願年月: 2022-06
- 出願国・地域: JP
- 見出し（ja）: 不審な追跡を検知すると配送を中断し対処する車両
- 見出し（en）: A vehicle that takes countermeasures when it detects a suspicious pursuer
- 公報の正式名称（ja）: 車両
- 請求項 1 全文（ja、根拠: JP2023183846A の `/ja`）: 不審人物又は不審車両が追跡していると判定すると、アラートの発出、配送先ユーザへの通知、置き配の中断、ルートの変更、及びセキュリティボックスの設置の何れかを含む対処行動を実行する制御部を備える、車両。
- 見出し（en）もこの日本語の請求項（JP2023183846A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 57. JP2022012286A

- 出願年月: 2020-07
- 出願国・地域: JP
- 見出し（ja）: 発進後の減速時に前方に交差点があればハザードを点灯
- 見出し（en）: Flashing hazard lights when decelerating after starting near an upcoming intersection
- 公報の正式名称（ja）: 車両制御装置
- 請求項 1 全文（ja、根拠: JP2022012286A の `/ja`）: ハードウェアを有するプロセッサを備え、 前記プロセッサは、 車両が停止状態から発進した後に減速した場合、前記車両の進行方向前方に交差点がある場合に限り、ハザードランプを点灯する、 車両制御装置。
- 見出し（en）もこの日本語の請求項（JP2022012286A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 58. JP2021140304A

- 出願年月: 2020-03
- 出願国・地域: JP
- 見出し（ja）: SNS投稿から配車依頼を検知し条件に合う友人に通知
- 見出し（en）: Detecting a ride request from an SNS post and notifying matching nearby friends
- 公報の正式名称（ja）: 情報処理装置
- 請求項 1 全文（ja、根拠: JP2021140304A の `/ja`）: 第１のユーザの端末からＳＮＳ（Social Network Service）システムへ投稿されたメッセージが配車依頼を示すか否かを判定することと、 前記メッセージが配車依頼を示す場合に、前記第１のユーザの現在位置及び目的地を特定することと、 前記ＳＮＳシステムにおいて、前記第１のユーザの友達リストに登録されている一次友達ユーザと、前記一次友達ユーザの友達リストに登録されている二次友達ユーザとのうち、前記第１のユーザの前記現在位置又は前記目的地の少なくとも一方に関する地理的条件を満たす第２のユーザを特定することと、 前記第２のユーザの端末に、前記第１のユーザの前記配車依頼を示す前記メッセージの投稿を通知すること、 を実行する制御部、 を備える情報処理装置。
- 見出し（en）もこの日本語の請求項（JP2021140304A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 59. JP2021111156A

- 出願年月: 2020-01
- 出願国・地域: JP
- 見出し（ja）: 前方車の灯火が見えにくいと車間拡大か通知の少なくとも一方を実施
- 見出し（en）: Widening the gap or alerting the driver when a lead vehicle's lights are hard to see
- 公報の正式名称（ja）: 車両制御装置
- 請求項 1 全文（ja、根拠: JP2021111156A の `/ja`）: ハードウェアを有するプロセッサを備え、 前記プロセッサは、 画像認識または車車間通信を用いて、前方車両のブレーキランプまたはウインカーの見やすさを判定し、 前記前方車両のブレーキランプまたはウインカーが見えにくいと判定した場合、前記前方車両との車間距離を設定値よりも広げる制御と、運転者への通知との、少なくとも一方を実施する、 車両制御装置。
- 見出し（en）もこの日本語の請求項（JP2021111156A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 60. JP2021111155A

- 出願年月: 2020-01
- 出願国・地域: JP
- 見出し（ja）: 発進中の前方車と周囲車の速度差から自車運転者に警告
- 見出し（en）: Warning the driver when a starting lead vehicle's speed differs greatly from nearby lanes
- 公報の正式名称（ja）: 運転支援装置
- 請求項 1 全文（ja、根拠: JP2021111155A の `/ja`）: ハードウェアを有するプロセッサを備え、 前記プロセッサは、 前方車両が停車状態から動き始めて、所定時間または所定速度に達するまでの間、自車両の周囲のレーンを走行する車両の速度と、前方車両の速度との差が所定値より大きい場合、自車両の運転者に警告を通知する、 運転支援装置。
- 見出し（en）もこの日本語の請求項（JP2021111155A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 61. JP2021111271A

- 出願年月: 2020-01
- 出願国・地域: JP
- 見出し（ja）: 危険運転を検知すると車内に鎮静効果の香りを拡散
- 見出し（en）: Diffusing a calming scent in the cabin upon detecting dangerous driving
- 公報の正式名称（ja）: 情報処理装置
- 請求項 1 全文（ja、根拠: JP2021111271A の `/ja`）: 車両に搭載される情報処理装置であって、 前記車両の運転者が危険運転をしているか否かを判定することと、 前記車両の運転者が危険運転をしていると判定する場合には、前記車両に備えられる香気拡散装置に、怒り又は興奮の鎮静作用又はリラックス効果があるとされている香気を拡散させることと、 を実行する制御部、 を備える情報処理装置。
- 見出し（en）もこの日本語の請求項（JP2021111271A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 62. JP2021114102A

- 出願年月: 2020-01
- 出願国・地域: JP
- 見出し（ja）: 周辺車両の水はねから道路冠水レベルを判定し地図化
- 見出し（en）: Judging and mapping road flooding levels from splash patterns on nearby vehicles
- 公報の正式名称（ja）: 冠水レベルマッピング装置
- 請求項 1 全文（ja、根拠: JP2021114102A の `/ja`）: ハードウェアを有するプロセッサを備え、 前記プロセッサは、 走行中の車両の位置に関する情報と、前記車両の車載カメラで撮像された画像であって、前記車両の周辺を走行する周辺車両の画像とを取得し、 前記画像から、前記周辺車両への水撥ねの有無と、前記周辺車両の車体の見え方とを認識し、 前記画像の認識結果に基づいて、前記車両の位置における道路の冠水レベルを判定し、 判定した前記冠水レベルを地図上にマッピングする、 冠水レベルマッピング装置。
- 見出し（en）もこの日本語の請求項（JP2021114102A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 63. JP2021113918A

- 出願年月: 2020-01
- 出願国・地域: JP
- 見出し（ja）: 不適切運転時の車内音を学習しリアルタイムで運転を判定
- 見出し（en）: Training on in-cabin audio during improper driving to judge live driving via a model
- 公報の正式名称（ja）: 情報処理装置
- 請求項 1 全文（ja、根拠: JP2021113918A の `/ja`）: 車両の運転者が行った運転操作と、車内の音声とを取得することと、 不適切な運転操作が行われた場合の所定の期間における車内の音声を特徴量に変換し、前記特徴量を教師データとして機械学習モデルを学習させることと、 学習済みの前記機械学習モデルに音声の特徴量を入力することで取得した前記不適切な運転操作の尤度に基づいて所定の処理を行うことと、 を実行する制御部を備える情報処理装置。
- 見出し（en）もこの日本語の請求項（JP2021113918A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 64. JP2021109563A

- 出願年月: 2020-01
- 出願国・地域: JP
- 見出し（ja）: 前方車の急減速を検知し後続車に警告
- 見出し（en）: Detecting a lead vehicle's hard deceleration and warning the vehicle behind
- 公報の正式名称（ja）: 運転支援装置
- 請求項 1 全文（ja、根拠: JP2021109563A の `/ja`）: ハードウェアを有するプロセッサを備え、 前記プロセッサは、 前方車両の減速度を検出し、 前記減速度が所定値より大きい場合、後方車両に警告を通知する、 運転支援装置。
- 見出し（en）もこの日本語の請求項（JP2021109563A）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

### 65. JP6549500B2

- 出願年月: 2016-02
- 出願国・地域: JP
- 見出し（ja）: 誤答話題を遠ざける話題推定学習装置
- 見出し（en）: Topic estimation learning that pushes projected vectors away from wrong topics
- 公報の正式名称（ja）: 話題推定学習装置及び話題推定学習方法
- 請求項 1 全文（ja、根拠: JP6549500B2 の `/ja`）: 話題と単語とを関連付けて格納する学習用データ格納部と、 前記単語を単語空間における単語ベクトルに変換する単語ベクトル変換部と、 前記話題を話題空間における話題ベクトルに変換する話題ベクトル変換部と、 前記単語ベクトルをクラスタリングするクラスタに対応した複数の射影行列を用いて、前記単語ベクトルを前記話題空間における複数の推定話題ベクトルに変換する射影変換部と、 前記話題ベクトルと前記複数の推定話題ベクトルとの前記話題空間における類似度を算出する類似度算出部と、 前記類似度に基づいて、前記単語ベクトルが従属すべき従属クラスタを決定するクラスタ決定部と、 前記推定話題ベクトルとの前記類似度が所定値よりも高い不正解の前記話題ベクトルと、前記推定話題ベクトルとの関係を負例関係として、前記従属クラスタに対応した前記射影行列を更新する射影行列更新部と、 を備える、話題推定学習装置。
- 見出し（en）もこの日本語の請求項（JP6549500B2）を根拠にしている（英語版の請求項は無いか、日本語版のほうが適切と判断したため、英語の請求項の抜粋はここでは省く）

## 同族のメンバー

65 同族のうち **49 件**が起点 117 公報のうち 2 件以上の公報を含む（複数国に出願している）。残り 16 件は起点公報の中では代表公報 1 件だけで完結する同族（`countries` は複数国のこともある。代表公報が起点 117 件の外にあり、`Country Status` / `Priority Applications` から他国の出願日・国名だけ分かっている場合を含む）。`members` は各同族に属する**起点 117 公報のうちの公報番号**（代表番号自身が起点公報に含まれる場合はそれも含む）。

| 代表公報番号 | 同族に含まれる起点公報（`members`） |
|---|---|
| JP7200645B2 | CN111301284B, US11057575B2 |
| JP7354888B2 | CN113401129B, US11904868B2 |
| JP6549500B2 | JP6549500B2, JP2017151838A |
| JP7192443B2 | CN111243332A, US11631326B2 |
| JP7371520B2 | CN113269988B, US20210256851A1 |
| JP7087966B2 | CN111238513B, JP2020085795A |
| JP7363621B2 | CN113401074B, US20210291856A1 |
| JP7347227B2 | CN113140119A, JP2021114110A |
| JP7147513B2 | CN111238491A, US11074816B2 |
| JP7327279B2 | CN113744551A, US20210370964A1 |
| JP2020093622A | CN111301285A, US20200180533A1 |
| JP7294200B2 | CN113411776A, US20210289331A1 |
| JP7251120B2 | CN111246160A, US11176826B2 |
| JP7206854B2 | CN111243314A, JP2020085792A |
| JP7310636B2 | CN113344312A, US11912276B2 |
| JP7318576B2 | CN113492768B, US12130151B2 |
| JP7420036B2 | CN114331248B, US11928751B2 |
| JP7347276B2 | CN113395316B, US20210284103A1 |
| JP7310729B2 | CN113813597B, US11670187B2 |
| JP2021117840A | CN113256364A, EP3859650A1 |
| JP7363647B2 | CN113553496B, US11727418B2 |
| JP7298526B2 | CN113453193B, US11606676B2 |
| JP7218557B2 | CN111311919A, US20200184237A1 |
| JP7115325B2 | CN111422128A, US11641453B2 |
| JP7626057B2 | CN116331121A, US20230196260A1 |
| JP7331792B2 | CN114119293A, US20210403040A1 |
| JP2021174115A | CN113538174A, JP2021174115A |
| JP2021189770A | CN113743976A, US20210372804A1 |
| JP7331773B2 | CN113587939A, JP2021176054A |
| JP7287291B2 | CN113135091B, US11904879B2 |
| JP7396214B2 | CN113852916B, US12586688B2 |
| JP2021117615A | CN113160552A, US20210233398A1 |
| JP7371562B2 | CN113497750B, US11908033B2 |
| JP7347344B2 | CN113902570A, US20210398224A1 |
| JP7711636B2 | CN117227753A, US20230409029A1 |
| JP7683552B2 | CN117273560A, US20230421384A1 |
| JP7415822B2 | CN113928246A, JP2022011114A |
| JP7331781B2 | CN113744090A, US12172676B2 |
| JP7856003B2 | CN118261665A, JP2024095097A |
| JP2025096043A | CN120156521A, JP2025096043A |
| JP2025105050A | TWI923233B, TW202539941A, JP2025105050A |
| JP7666423B2 | CN117391570A, US20240013132A1 |
| US20250199754A1 | CN120156444A, US20250199754A1 |
| JP7852619B2 | CN120156443A, JP2025096046A |
| JP7677243B2 | CN117252497A, US20230405832A1 |
| JP2025095982A | CN120156448A, US20250196772A1 |
| US20250146351A1 | CN119957041A, US20250146351A1 |
| JP2025095991A | CN120164348A, DE102024137601A1 |
| JP2025095979A | CN120166291A, US20250196785A1 |

## 落とした公報の表

| 公報番号 | 名称 | 発明者一覧 | 落とした理由 |
|---|---|---|---|
| JP7151181B2（同族: JP7151181B2, CN110634479B） | VOICE DIALOGUE SYSTEM, PROCESSING METHOD AND PROGRAM THEREOF | 生聖 渡部、佐和 樋口、達朗 堀、渡部生圣、樋口佐和、堀达朗 | 発明者一覧に不一致。`山根丈亮` は説明文中の引用文献の著者として現れるのみ（design.md D2, 裁定 R11） |

