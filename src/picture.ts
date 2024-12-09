import { P5CanvasInstance, SketchProps } from "react-p5-wrapper";

// 型定義
type MySketchProps = SketchProps & {
  inputNumberList: string;
  numberSize: number;
  numberRange: number;
  numberHeight: number;
  sequenceHeight: number;
  select: string;
  delete1: boolean;
  deleteline: boolean;
};

export type Sequence = number[];
export type Matrix = number[][];

// 定数
const DEFAULT_FRAME_RATE = 60;

export const sketch_input = (p: P5CanvasInstance<MySketchProps>) => {
  let input = "";
  let numSize = 0;
  let numRange = 0;
  let numHeight = 0;
  let seqHeight = 0;
  let selected = "thr";
  let delone = false;
  let delLine = false;
  let update = true;

  p.setup = () => {
    p.createCanvas(0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.frameRate(DEFAULT_FRAME_RATE);
  };

  p.updateWithProps = (props: MySketchProps) => {
    if (
      input !== props.inputNumberList ||
      numSize !== props.numberSize ||
      numRange !== props.numberRange ||
      numHeight !== props.numberHeight ||
      seqHeight !== props.sequenceHeight ||
      selected !== props.select ||
      delone !== props.delete1 ||
      delLine !== props.deleteline
    ) {
      update = true;
    }
    ({
      inputNumberList: input,
      numberSize: numSize,
      numberRange: numRange,
      numberHeight: numHeight,
      sequenceHeight: seqHeight,
      select: selected,
      delete1: delone,
      deleteline: delLine,
    } = props);
  };

  p.draw = () => {
    if (update) {
      update = false;
      try {
        const strArr = input
          .split(/[\n\s]/)
          .filter((line) => line.trim() !== "");
        if (strArr.length === 0) {
          p.resizeCanvas(0, 0);
          return;
        }
        const parsedData = strArr.map((x) => parseString(x, selected));
        const canvasHeight =
          parsedData.reduce(
            (acc, { parent }) => acc + (1 + parent.length) * numHeight,
            0
          ) +
          (strArr.length - 1) * seqHeight;
        const canvasWidth =
          (0.5 +
            Math.max(...parsedData.map(({ parent }) => parent[0].length))) *
          numRange;
        p.resizeCanvas(canvasWidth, canvasHeight);

        let currentHeight = 0;
        parsedData.forEach(({ type, matrix, parent }) => {
          drawMountain(type, matrix, parent, currentHeight);
          currentHeight += (1 + parent.length) * numHeight + seqHeight;
        });
      } catch (e) {
        console.error("Error in draw function:", e);
      }
    }
  };

  const drawMountain = (
    type: string,
    matrix: Matrix,
    parent: Matrix,
    height: number
  ) => {
    p.textSize(numSize);
    if (type == "0-Y") {
      matrix.forEach((row, j) => {
        row.forEach((val, i) => {
          const x1 = (0.5 + i) * numRange;
          const y1 = (0.5 + parent.length - j) * numHeight + height;
          if (j === 0) p.text(val, x1, y1);
          else {
            const parentIdx = parent[j - 1][i];
            if (
              !delone ||
              !row.every((_, x) => i !== parent[j][x]) ||
              parentIdx !== -1 ||
              parent[j][i] !== -1
            )
              p.text(val, x1, y1);
            if (!delLine && parentIdx !== -1) {
              const x2 = (0.5 + parentIdx) * numRange;
              const y2 = y1 + numHeight;
              p.line(x1, y1 + numSize / 2, x2, y2 - numSize / 2);
              p.line(x1, y1 + numSize / 2, x1, y2 - numSize / 2);
            }
          }
        });
      });
    } else {
      matrix.forEach((row, j) => {
        row.forEach((val, i) => {
          const x1 = (0.5 + i) * numRange;
          const y1 = (0.5 + j) * numHeight + height;
          if (j !== parent.length - 1) p.text(val, x1, y1);
          if (j !== 0) {
            const parentIdx = parent[j - 1][i];
            if (!delLine && parentIdx !== -1) {
              const x2 = (0.5 + parentIdx) * numRange;
              const y2 = y1 - numHeight;
              p.line(x1, y1 - numSize / 2, x2, y2 + numSize / 2);
              p.line(x1, y1 - numSize / 2, x1, y2 + numSize / 2);
            }
          }
        });
      });
    }
  };
};

export function parseString(str: string, mode: string) {
  const matches = str.match(/\([\d,]+\)/g);
  if (!matches) {
    const sequence: Sequence = str
      .split(",")
      .map((x) => parseInt(x))
      .filter((x) => !isNaN(x));

    const { matSeq, matParent } = create0YMatrices(sequence);

    if (mode === "BMS") {
      return {
        type: "BMS",
        matrix: transform0YToBMS(matSeq, matParent),
        parent: createBMSParent(matSeq),
      };
    } else {
      return {
        type: "0-Y",
        matrix: matSeq,
        parent: matParent,
      };
    }
  } else {
    const matrix: Matrix = matches.map((match) =>
      match
        .slice(1, -1)
        .split(",")
        .map((x) => parseInt(x))
        .filter((x) => !isNaN(x))
    );
    const maxCols = Math.max(...matrix.map((row) => row.length));
    matrix.forEach((row) => {
      while (row.length < maxCols) row.push(0);
    });
    const mat = transpose(matrix);
    mat.push(Array(matrix.length).fill(0));

    const par = createBMSParent(mat);

    if (mode === "0-Y") {
      const seq = transformBMSTo0Y(mat, par);
      const matrices = create0YMatrices(seq);
      return {
        type: "0-Y",
        matrix: matrices.matSeq,
        parent: matrices.matParent,
      };
    }
    return {
      type: "BMS",
      matrix: mat,
      parent: par,
    };
  }
}

export function transpose(matrix: Matrix): Matrix {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];
  for (let j = 0; j < cols; j++) {
    const column: number[] = [];
    for (let i = 0; i < rows; i++) {
      column.push(matrix[i][j]);
    }
    result.push(column);
  }
  return result;
}

export function transform0YToBMS(seq: Matrix, seqParent: Matrix): Matrix {
  const result = Array<Sequence>(seq.length);
  for (let i = seq.length - 1; i > -1; i--) {
    const column: Sequence = [];
    for (let j = 0; j < seq[0].length; j++) {
      const mp = seqParent[i][j];
      if (seqParent[i][j] === -1) {
        column.push(0);
      } else {
        column.push(column[mp] + 1);
      }
    }
    result[i] = column;
  }
  return result;
}

export function transformBMSTo0Y(mat: Matrix, matParent: Matrix): Sequence {
  const result = Array<Sequence>(mat.length);
  for (let i = mat.length - 1; i > -1; i--) {
    const column: Sequence = [];
    for (let j = 0; j < mat[0].length; j++) {
      const mp = matParent[i][j];
      if (matParent[i][j] === -1) {
        column.push(1);
      } else {
        column.push(column[mp] + result[i + 1][j]);
      }
    }
    result[i] = column;
  }
  return result[0];
}

export function create0YMatrices(seq: Sequence) {
  const matSeq: Matrix = [];
  const matParent: Matrix = [];

  let sequence = seq;
  let parents = seq.map((_, i) => parent(seq, i));
  matSeq.push(sequence);
  matParent.push(parents);
  while (!parents.every((x) => x === -1)) {
    sequence = sequence.map((val, i) =>
      parents[i] === -1 ? 1 : val - sequence[parents[i]]
    );
    parents = calculateParentWithPreviousAncestors(sequence, parents);

    matSeq.push(sequence);
    matParent.push(parents);
  }
  return { matSeq, matParent };
}

export function createBMSParent(mat: Matrix): Matrix {
  const matParent: Matrix = [];
  let parents = mat[0].map((_, i) => parent(mat[0], i));
  matParent.push(parents);
  for (let i = 1; i < mat.length; i++) {
    parents = calculateParentWithPreviousAncestors(mat[i], parents);
    matParent.push(parents);
  }
  return matParent;
}

function calculateParentWithPreviousAncestors(
  leg: Sequence,
  parentf: Sequence
): Sequence {
  return leg.map((_, i) => {
    let j = i;
    while ((j = parentf[j]) !== -1 && leg[i] <= leg[j]);
    return j;
  });
}

function parent(seq: Sequence, x: number): number {
  let p = x - 1;
  while (p >= 0 && seq[p] >= seq[x]) p--;
  return p;
}

export function expand(mat: Matrix, matParent: Matrix, times: number): Matrix {
  const rowEnd = mat[0].length - 1;

  // 非零最下行 nonZero
  let nonZero = mat.length - 1;
  while (mat[nonZero][rowEnd] === 0) {
    nonZero--;
  }

  const badroot = matParent[nonZero][rowEnd];
  const badpart: Matrix = mat.map((row) => row.slice(badroot, rowEnd));
  // 上昇判定
  const ascendingJudgment: Matrix = [];
  for (let i = 0; i < mat.length; i++) {
    const columnParent: Sequence = [];
    const columnBool: Sequence = [];
    for (let j = badroot; j < rowEnd; j++) {
      columnParent.push(
        matParent[i][j] < badroot ? -1 : matParent[i][j] - badroot
      );
      columnBool.push(
        j === badroot || columnBool[columnParent[j - badroot]] ? 1 : 0
      );
    }
    ascendingJudgment.push(columnBool);
  }

  // 階差
  const delta: Sequence = [];
  for (let i = 0; i < mat.length; i++) {
    if (i < nonZero) delta.push(mat[i][rowEnd] - badpart[i][0]);
    else delta.push(0);
  }

  // 階差の足し上げ
  let result = transpose(mat).slice(0, -1);
  for (let i = 1; i <= times; i++) {
    const ascendBadpart: Matrix = [];
    for (let j = 0; j < badpart[0].length; j++) {
      const column: Sequence = [];
      for (let k = 0; k < badpart.length; k++) {
        column.push(badpart[k][j] + i * delta[k] * ascendingJudgment[k][j]);
      }
      ascendBadpart.push(column);
    }
    result = result.concat(ascendBadpart);
  }
  return transpose(result);
}