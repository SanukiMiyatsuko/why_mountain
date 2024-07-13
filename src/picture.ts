import p5 from "p5";
import { P5CanvasInstance } from "react-p5-wrapper";
import { MySketchProps } from "./App";

// 型定義
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
    let selected = 'thr';
    let del = false;
    let update = true;

    p.setup = () => {
        p.createCanvas(0, 0);
        p.textAlign(p.CENTER, p.CENTER);
        p.frameRate(DEFAULT_FRAME_RATE);
    };

    p.updateWithProps = (props: MySketchProps) => {
        const inp = input;
        const ns = numSize;
        const nr = numRange;
        const nh = numHeight;
        const sh = seqHeight;
        const sl = selected;
        const de = del;
        ({
            inputNumberList: input,
            numberSize: numSize,
            numberRange: numRange, 
            numberHeight: numHeight,
            sequenceHeight: seqHeight,
            select: selected,
            delete1: del,
        } = props);
        if (
            inp !== input ||
            ns !== numSize ||
            nr !== numRange ||
            nh !== numHeight ||
            sh !== seqHeight ||
            sl !== selected ||
            de !== del
        ) {
            update = true;
        }
    };

    p.draw = () => {
        try {
            if (update) {
                update = false;
                const strArr = input.split(/\n/).filter(line => line.trim() !== '');
                if (strArr.length === 0) {
                    p.resizeCanvas(0, 0);
                    return;
                }
                const parsedData = strArr.map(parseString);
                const canvasHeight = parsedData.reduce((acc, { depth }) => acc + (1 + depth) * numHeight, 0) + (strArr.length - 1) * seqHeight;
                const canvasWidth = (0.5 + Math.max(...parsedData.map(({ width }) => width))) * numRange;
                p.resizeCanvas(canvasWidth, canvasHeight);
                let currentHeight = 0;
                parsedData.forEach(({ array, depth }) => {
                    drawMountain(array, p, numSize, numRange, numHeight, currentHeight, depth, selected, del);
                    currentHeight += (1 + depth) * numHeight + seqHeight;
                });
            }
        } catch (e) {
            console.error("Error in draw function:", e);
        }
    };
};

export function parseString(str: string) {
    const matches = str.match(/\([\d,]+\)/g);
    if (!matches) {
        const sequence: Sequence = str.split(',').map(x => parseInt(x)).filter(x => !isNaN(x));
        return {
            array: sequence,
            depth: calculateDepthMax(sequence),
            width: sequence.length
        };
    } else {
        const matrix: Matrix = matches.map(match => match.slice(1, -1).split(',').map(x => parseInt(x)).filter(x => !isNaN(x)));
        const maxCols = Math.max(...matrix.map(row => row.length));
        matrix.forEach(row => {
            while (row.length < maxCols) row.push(0);
        });
        let mat = transformMatrix(matrix);
        mat.push(Array(matrix.length).fill(0));
        return {
            array: mat,
            depth: maxCols,
            width: matrix.length
        };
    }
}

function calculateDepthMax(seq: Sequence): number {
    let depth = 0;
    while (!seqMatrix(seq, depth)[1].every(x => x === -1)) {
        depth++;
    }
    return depth;
}

export function transformMatrix(matrix: Matrix): Matrix {
    const rows = matrix.length;
    const cols = matrix[0].length;
    let result: number[][] = [];
    for (let j = 0; j < cols; j++) {
        let column: number[] = [];
        for (let i = 0; i < rows; i++) {
            column.push(matrix[i][j]);
        }
        result.push(column);
    }
    return result;
}

export function isSequence(a: Sequence | Matrix): a is Sequence {
    return !Array.isArray(a[0]);
}

function drawMountain(
    seqOrMat: Sequence | Matrix,
    p: p5,
    size: number,
    range: number,
    height: number,
    seqHeight: number,
    depthMax: number,
    selected: string,
    del: boolean
) {
    p.textSize(size);
    if (isSequence(seqOrMat)) {
        const { matSeq, matParent } = createMatrix(seqOrMat, depthMax);
        if (selected === 'BMS') {
            const seq = transform0YToBMS(matSeq, matParent);
            drawMountain(seq, p, size, range, height, seqHeight, depthMax, selected, del);
        } else {
            matSeq.forEach((row, j) => {
                row.forEach((val, i) => {
                    const x1 = (0.5 + i) * range;
                    const y1 = (0.5 + depthMax - j) * height + seqHeight;
                    if (j === 0) p.text(val, x1, y1);
                    else {
                        const parentIdx = matParent[j - 1][i];
                        if (!del || !(row.every((_, x) => i !== matParent[j][x])) || parentIdx !== -1 || matParent[j][i] !== -1)
                            p.text(val, x1, y1);
                        if (parentIdx !== -1) {
                            const x2 = (0.5 + parentIdx) * range;
                            const y2 = y1 + height;
                            p.line(x1, y1 + size / 2, x2, y2 - size / 2);
                            p.line(x1, y1 + size / 2, x1, y2 - size / 2);
                        }
                    }
                });
            });
        }
    } else {
        let matParent = createMatrixForMatrix(seqOrMat, depthMax);
        if (selected === '0-Y') {
            const seq = transformBMSTo0Y(seqOrMat, matParent);
            drawMountain(seq, p, size, range, height, seqHeight, depthMax, selected, del);
        } else {
            seqOrMat.forEach((row, j) => {
                row.forEach((val, i) => {
                    const x1 = (0.5 + i) * range;
                    const y1 = (0.5 + j) * height + seqHeight;
                    if (j !== depthMax) p.text(val, x1, y1);
                    if (j !== 0) {
                        const parentIdx = matParent[j - 1][i];
                        if (parentIdx !== -1) {
                            const x2 = (0.5 + parentIdx) * range;
                            const y2 = y1 - height;
                            p.line(x1, y1 - size / 2, x2, y2 + size / 2);
                            p.line(x1, y1 - size / 2, x1, y2 + size / 2);
                        }
                    }
                });
            });
        }
    }
}

export function transform0YToBMS(seq: Matrix, seqParent: Matrix): Matrix {
    let result = Array<Sequence>(seq.length);
    for (let i = seq.length-1; i > -1; i--) {
        let column: Sequence = [];
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
    let result = Array<Sequence>(mat.length);
    for (let i = mat.length-1; i > -1; i--) {
        let column: Sequence = [];
        for (let j = 0; j < mat[0].length; j++) {
            const mp = matParent[i][j];
            if (matParent[i][j] === -1) {
                column.push(1);
            } else {
                column.push(column[mp] + result[i+1][j]);
            }
        }
        result[i] = column;
    }
    return result[0];
}

export function createMatrix(seq: Sequence, depthMax: number) {
    const matSeq: Matrix = [];
    const matParent: Matrix = [];
    for (let i = 0; i <= depthMax; i++) {
        const [s, p] = seqMatrix(seq, i);
        matSeq.push(s);
        matParent.push(p);
    }
    return { matSeq, matParent };
}

function seqMatrix(seq: Sequence, depth: number): [Sequence, Sequence] {
    if (depth === 0) {
        const parents = seq.map((_, i) => parent(seq, i));
        return [seq, parents];
    }
    const [prevSeq, prevParents] = seqMatrix(seq, depth - 1);
    const legs = prevSeq.map((val, i) => 
        prevParents[i] === -1 ? 1 : val - prevSeq[prevParents[i]]
    );
    const parents = calculateParentWithPreviousAncestors(legs, prevParents);
    return [legs, parents];
}

export function createMatrixForMatrix(mat: Matrix, depthMax: number): Matrix {
    const matParent: Matrix = [];
    for (let i = 0; i <= depthMax; i++) {
        matParent.push(matMatrix(mat, i));
    }
    return matParent;
}

function matMatrix(mat: Matrix, depth: number): Sequence {
    if (depth === 0) {
        const parents = mat[0].map((_, i) => parent(mat[0], i));
        return parents;
    }
    const prevParents = matMatrix(mat, depth - 1);
    const parents = calculateParentWithPreviousAncestors(mat[depth], prevParents);
    return parents;
}

function calculateParentWithPreviousAncestors(leg: Sequence, parentf: Sequence): Sequence {
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
    let nonZero = mat.length-1;
    while (mat[nonZero][mat[0].length-1] === 0) {
        nonZero--;
    }
    const badroot = matParent[nonZero][mat[0].length-1];
    let badpart: Matrix = [];
    let badpartParent: Matrix = [];
    let ascendingJudgment: Matrix = [];
    for (let i = 0; i < mat.length; i++) {
        let column: Sequence = [];
        let columnParent: Sequence = [];
        let columnBool: Sequence = [];
        for (let j = badroot; j < mat[0].length-1; j++) {
            column.push(mat[i][j]);
            columnParent.push(matParent[i][j] < badroot ? -1 : matParent[i][j] - badroot);
            if (j === badroot || columnBool[columnParent[j - badroot]]) {
                columnBool.push(1);
            } else {
                columnBool.push(0);
            }
        }
        badpart.push(column);
        badpartParent.push(columnParent);
        ascendingJudgment.push(columnBool);
    }
    let delta: Sequence = [];
    for (let i = 0; i < mat.length; i++) {
        if (i < nonZero) delta.push(mat[i][mat[0].length-1] - badpart[i][0]);
        else delta.push(0);
    }
    badpart = transformMatrix(badpart);
    ascendingJudgment = transformMatrix(ascendingJudgment);
    let result = transformMatrix(mat).slice(0, -1);
    for (let i = 1; i <= times; i++) {
        let ascendBadpart: Matrix = [];
        for (let j = 0; j < badpart.length; j++) {
            let column: Sequence = [];
            for (let k = 0; k < badpart[0].length; k++) {
                column.push(badpart[j][k] + (i * delta[k] * ascendingJudgment[j][k]));
            }
            ascendBadpart.push(column);
        }
        result = result.concat(ascendBadpart);
    }
    return transformMatrix(result);
}