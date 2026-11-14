# Итог задания 007: что нужно от `ipaddress` (для DeepSeek, часть «б» форка Skulpt)

Составлено по решению GLM 24 задач № 10 ЕГЭ 2027 (условия и решения — в закрытом месте, сюда не кладём). Все примеры ниже — нейтральные адреса, проверены в CPython 3.12.

## Обязательно (почти во всех задачах)
| Конструкция | Пример | Значение |
|---|---|---|
| `ip_network(строка, strict=False)`; строка `'адрес/длина'` или `'адрес/маска'` | `ip_network('10.0.96.0/255.255.240.0', strict=False)` | `10.0.96.0/20` |
| `ip_address(строка)` | `ip_address('192.0.2.17')` | `IPv4Address` |
| `int(адрес)` | `int(ip_address('255.255.255.255'))` | `4294967295` |
| `.network_address`, `.netmask`, `.prefixlen`, `.num_addresses` | `ip_network('10.0.0.0/20').num_addresses` | `4096` |
| итерация `for ip in net` — все адреса сети, включая сетевой и широковещательный | `len(list(ip_network('192.0.2.0/30')))` | `4` |

## Реже
`.hosts()` (без сетевого и широковещательного) — 1 задача; `ip in net` — 1 задача; `.broadcast_address`.

## Подводный камень
`ip_network((адрес_int, 24))` — второй элемент воспринимается как маска-число, не как длина префикса; решения строят сеть из строки `f"{адрес}/{длина}"`.

## Тесты (assert, нейтральные данные)
```python
import ipaddress as I
n = I.ip_network('10.0.96.0/255.255.240.0', strict=False)
assert str(n) == '10.0.96.0/20' and n.num_addresses == 4096 and n.prefixlen == 20
assert int(I.ip_address('255.255.255.255')) == 0xFFFFFFFF
assert I.ip_network('192.0.2.17/24', strict=False).network_address == I.ip_address('192.0.2.0')
assert int(I.ip_network('10.2.252.76/19', strict=False).netmask) == 0xFFFFE000
assert I.ip_address('192.0.2.5') in I.ip_network('192.0.2.0/24')
assert I.ip_address('192.0.3.5') not in I.ip_network('192.0.2.0/24')
assert [str(x) for x in I.ip_network('192.0.2.0/30')] == ['192.0.2.0', '192.0.2.1', '192.0.2.2', '192.0.2.3']
assert [str(x) for x in I.ip_network('192.0.2.0/30').hosts()] == ['192.0.2.1', '192.0.2.2']
assert I.ip_network('10.4.0.0/16').broadcast_address == I.ip_address('10.4.255.255')
```
