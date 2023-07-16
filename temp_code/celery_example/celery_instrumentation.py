# Based on https://github.com/lyst/celery-statsd


import threading
import time

import celery
import celery.signals
import six

from django_statsd.clients import statsd

_state = threading.local()


def task_key(task):
    prefix = getattr(celery.current_app.conf, "CELERY_STATSD_PREFIX", "celery.")

    if isinstance(task, six.string_types):
        return "{}{}".format(prefix, task)
    else:
        return "{}{}".format(prefix, task.name)


def start_timer(name, group, instance):
    try:
        _state.timers[(name, group, instance)] = time.time()
    except AttributeError:
        _state.timers = {(name, group, instance): time.time()}


def _get_timer(name, group, instance):
    try:
        return _state.timers.pop((name, group, instance))
    except (AttributeError, KeyError):
        return


def stop_timer(name, group, instance):

    start = _get_timer(name, group, instance)

    if start is None:
        return

    total = time.time() - start

    while group:
        statsd.timing("{0}.{1}".format(group, name), total * 1000)
        group = ".".join(group.split(".")[:-1])


def inc_counter(name, group):
    while group:
        statsd.incr("{0}.{1}".format(group, name))
        group = ".".join(group.split(".")[:-1])


@celery.signals.before_task_publish.connect
def statsd_before_task_publish(sender, body, headers, **kwargs):
    task_id = headers.get("id") or body.get("id")
    start_timer("ENQUEUE", task_key(sender), task_id)


@celery.signals.after_task_publish.connect
def statsd_after_task_publish(sender, body, headers, **kwargs):
    task_id = headers.get("id") or body.get("id")
    stop_timer("ENQUEUE", task_key(sender), task_id)


@celery.signals.task_prerun.connect
def statsd_task_prerun(sender, task_id, **kwargs):
    start_timer("RUN", task_key(sender), task_id)


@celery.signals.task_postrun.connect
def statsd_task_postrun(sender, task_id, **kwargs):
    stop_timer("RUN", task_key(sender), task_id)


@celery.signals.task_retry.connect
def statsd_task_retry(sender, **kwargs):
    inc_counter("RETRY", task_key(sender))


@celery.signals.task_success.connect
def statsd_task_success(sender, **kwargs):
    inc_counter("SUCCESS", task_key(sender))


@celery.signals.task_failure.connect
def statsd_task_failure(sender, **kwargs):
    inc_counter("FAILURE", task_key(sender))


@celery.signals.task_revoked.connect
def statsd_task_revoked(sender, **kwargs):
    inc_counter("REVOKED", task_key(sender))
