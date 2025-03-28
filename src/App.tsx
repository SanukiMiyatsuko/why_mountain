import { useState } from "react";
import { ReactP5Wrapper } from "react-p5-wrapper";
import "./App.css";
import {
  create0YMatrices,
  createBMSParent,
  expand,
  Matrix,
  parseString,
  sketch_input,
  transform0YToBMS,
  transformBMSTo0Y,
  transpose,
} from "./picture";

function App() {
  const [inputA, setInputA] = useState(
    "1,4,6,3,7,9,7\n(0)(1,1,1)(2,1)(1,1)(2,2,1)(3,1)(2,2,1)"
  );
  const [inputB, setInputB] = useState("0");
  const [inputHeadSize, setInputHeadSize] = useState(30);
  const [inputNumberRange, setInputNumberRange] = useState(55);
  const [inputNumberHeight, setInputNumberHeight] = useState(63);
  const [inputSequenceHeight, setInputSequenceHeight] = useState(63);
  const [selected, setSelected] = useState("thr");
  const [delone, setDeleteone] = useState(false);
  const [delLine, setDeleteLine] = useState(false);

  const compute = () => {
    const strArr = inputA.split(/[\n\s]/).filter((line) => line.trim() !== "");
    if (strArr.length === 0 || !inputB) {
      return;
    }
    const parsedData = parseString(strArr[strArr.length - 1], selected);
    let mat: Matrix = [];
    let matParent: Matrix = [];
    if (parsedData.type === "0-Y") {
      const { matSeq, matParent } = create0YMatrices(parsedData.matrix[0]);
      mat = transform0YToBMS(matSeq, matParent);
    } else {
      mat = parsedData.matrix;
      matParent = parsedData.parent;
    }

    let outputMat = expand(mat, matParent, parseInt(inputB));

    if (parsedData.type === "0-Y") {
      const outputMatParent = createBMSParent(outputMat);
      const seq = transformBMSTo0Y(outputMat, outputMatParent);
      let str = seq.toString();
      str = inputA + "\n" + str;
      setInputA(str);
    } else {
      while (outputMat[outputMat.length-1].every(x => x === 0)) {
        outputMat = outputMat.slice(0,-1);
      }
      const trunsoutputMat = transpose(outputMat);
      const strarr = trunsoutputMat.map(
        (x) => "(" + x.toString() + ")"
      );
      const str = inputA + "\n" + strarr.toString().replace(/\),\(/g, ")(");
      setInputA(str);
    }
    return;
  };

  return (
    <div className="app">
      <header>why mounTain</header>
      <main>
        <div className="optionAndCal">
          <div className="option">
            <div className="inputCon">
              <div className="inputTab">
                <textarea
                  className="inputText"
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  placeholder="入力A"
                  autoComplete="off"
                  rows={5}
                  cols={50}
                />
                <div className="miniInput">
                  <input
                    className="inputNumber"
                    value={inputB}
                    onChange={(e) => setInputB(e.target.value)}
                    type="number"
                    placeholder="入力B"
                    autoComplete="off"
                    min="0"
                  />
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="0-Y">0-Y</option>
                    <option value="BMS">BMS</option>
                    <option value="thr">そのまま</option>
                  </select>
                  <button className="calButton" onClick={() => compute()}>
                    A[B]を計算
                  </button>
                </div>
                <div className="optionCheckbox">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={delLine}
                      onChange={() => setDeleteLine(!delLine)}
                    />
                    &nbsp;線を削除
                  </label>
                  {selected !== "BMS" ? (
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={delone}
                        onChange={() => setDeleteone(!delone)}
                      />
                      &nbsp;余分な1を削除
                    </label>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="hydra">
                  <ul>
                    <li>
                      数字の大きさ：
                      <input
                        className="hydraSize"
                        value={inputHeadSize}
                        onChange={(e) =>
                          setInputHeadSize(parseInt(e.target.value))
                        }
                        min="0"
                        max="200"
                        type="range"
                      />
                    </li>
                    <li>
                      数字間の幅：
                      <input
                        className="hydraRange"
                        value={inputNumberRange}
                        onChange={(e) =>
                          setInputNumberRange(parseInt(e.target.value))
                        }
                        min="0"
                        max="200"
                        type="range"
                      />
                    </li>
                    <li>
                      数字間の高さ：
                      <input
                        className="hydraSize"
                        value={inputNumberHeight}
                        onChange={(e) =>
                          setInputNumberHeight(parseInt(e.target.value))
                        }
                        min="0"
                        max="200"
                        type="range"
                      />
                    </li>
                    <li>
                      数列間の高さ：
                      <input className="hydraSize"
                        value={inputSequenceHeight}
                        onChange={(e) =>
                          setInputSequenceHeight(parseInt(e.target.value))
                        }
                        min="0"
                        max="200"
                        type="range"
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ReactP5Wrapper
          sketch={sketch_input}
          inputNumberList={inputA}
          numberSize={inputHeadSize}
          numberRange={inputNumberRange}
          numberHeight={inputNumberHeight}
          sequenceHeight={inputSequenceHeight}
          select={selected}
          delete1={delone}
          deleteline={delLine}
        />
      </main>
      <footer>
        <a href="https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:%E3%82%86%E3%81%8D%E3%81%A8/%5C(0%5C)-Y%E6%95%B0%E5%88%97" target="_blank" rel="noreferrer">ユーザーブログ:ゆきと/%5C(0%5C)-Y数列</a>(2025/03/25 閲覧)<br />
        <a href="https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:BashicuHyudora/BASIC%E8%A8%80%E8%AA%9E%E3%81%AB%E3%82%88%E3%82%8B%E5%B7%A8%E5%A4%A7%E6%95%B0%E3%81%AE%E3%81%BE%E3%81%A8%E3%82%81#%E3%83%90%E3%82%B7%E3%82%AF%E8%A1%8C%E5%88%97%E6%95%B0(Bashicu_matrix_number)" target="_blank" rel="noreferrer">ユーザーブログ:BashicuHyudora/BASIC言語による巨大数のまとめ#バシク行列数(Bashicu_matrix_number)</a>(2025/03/25 閲覧)<br />
        このページは<a href="https://creativecommons.org/licenses/by-sa/3.0/legalcode" target="_blank" rel="noreferrer">Creative Commons Attribution-ShareAlike 3.0 Unported License</a>の下に公開されます。<br />
        また、ページ作成の際に<a href="https://github.com/Naruyoko" target="_blank" rel="noreferrer">Naruyoko</a>氏の<a href="https://naruyoko.github.io/whYmountain/" target="_blank" rel="noreferrer">whY mountain</a>を参考にさせていただきました。<br />
        最終更新: 2025/03/25
      </footer>
    </div>
  );
}

export default App;