use wasm_bindgen::prelude::*;
use meval::eval_str;

#[wasm_bindgen]
pub fn evaluate_expression(expr: &str) -> f64 {
    eval_str(expr).unwrap_or(f64::NAN)
}