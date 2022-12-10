import './style.css'

interface Point {
    row: number;
    col: number;
}

interface Selection {
    start: Point;
    end: Point;
}

const display = document.querySelector<HTMLDivElement>('#display')!;
const editor = document.querySelector<HTMLTextAreaElement>('#editor')!;
const measure = document.querySelector<HTMLSpanElement>('#measure')!;

const cursor = document.querySelector<HTMLSpanElement>('#cursor')!;

let ourSelection: Selection;

function getLineNum(elem: HTMLElement): number | undefined {
    if (elem.hasAttribute('data-linenum')) {
        return parseInt(elem.getAttribute('data-linenum')!);
    }

    if (!elem.parentElement) {
        return;
    }

    return getLineNum(elem.parentElement)
}

display.addEventListener('click', () => {
    editor.focus();
})

display.addEventListener('mouseup', (ev: MouseEvent) => {
    let selection = document.getSelection();

    ourSelection = {
        start: {
            row: getLineNum(document.getSelection()?.anchorNode?.parentElement!)!,
            col: selection?.anchorOffset!,
        },
        end: {
            row: getLineNum(document.getSelection()?.focusNode?.parentElement!)!,
            col: selection?.focusOffset!,
        }
    }

    const lines = editor.value.split('\n');

    editor.selectionStart = pointToIndex(lines, ourSelection.start);
    editor.selectionEnd = pointToIndex(lines, ourSelection.end);
});

function indexToPoint(lines: string[], index: number): Point {
    let col = index;
    let row = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (col < line.length + 1) {
            break;
        }

        col -= line.length + 1;

        row += 1;
    }

    return {
        row, col
    }
}

function pointToIndex(lines: string[], point: Point): number {
    let index = 0;

    for (let i = 0; i < lines.length; i++) {
        if (i != point.row) {
            index += lines[i].length + 1;

            continue
        }

        break;
    }

    index += point.col;

    return index;
}

window.redrawTextArea = function() {
    const lines = editor.value.split('\n');

    let { row, col } = indexToPoint(lines, editor.selectionStart);

    measure.innerText = 'q'.repeat(col + 1);

    document.body.appendChild(cursor);
    display.innerHTML = lines
        .map(line => {
            if (line.length === 0) {
                line = "&nbsp;"
            }

            return `<span><pre> ${line}</pre></span>`;
        })
        .map((line, i) => {
            return `<div class="line" data-linenum="${i}">${line}</div>`;
        })
        .join('\n');

    let focusRow = display.children[row] as HTMLElement;

    focusRow.prepend(cursor);

    let xoffset = measure.getBoundingClientRect().width;
    let yoffset = 0;
    cursor.style.transform = `translate(${xoffset}px, ${yoffset}px)`;
}

editor.addEventListener('selectionchange', window.redrawTextArea);

window.redrawTextArea();
